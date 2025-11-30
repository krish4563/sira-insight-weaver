// src/pages/Research.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ResearchResult } from "@/components/ResearchResult";
import { KnowledgeGraphPreview } from "@/components/KnowledgeGraphPreview";
import { KnowledgeGraphModal } from "@/components/KnowledgeGraphModal";
import { SchedulerModal } from "@/components/SchedulerModal";
import { QuotaBar } from "@/components/QuotaBar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ResearchItem, KnowledgeGraph } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  knowledgeGraph?: KnowledgeGraph;
  results?: ResearchItem[];
}

export default function Research() {
  const { user } = useAuth();
  const { conversationId: urlConversationId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentKG, setCurrentKG] = useState<KnowledgeGraph | null>(null);
  const [showKGModal, setShowKGModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // ✅ Prevent multiple loads
  const isLoadingRef = useRef(false);
  const hasInitialized = useRef(false);

  // ✅ Load conversation from URL or create new one (ONLY ONCE)
  useEffect(() => {
  if (!user) return;
  
  const initializeConversation = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      if (urlConversationId) {
        // Load existing conversation from URL
        await loadConversation(urlConversationId);
      } else {
        // Create new conversation only if at root path and no conversation exists
        if (window.location.pathname === "/" && !conversationId && !hasInitialized.current) {
          hasInitialized.current = true;
          await handleNewConversation();
        }
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  initializeConversation();
}, [user, urlConversationId]);

  const handleNewConversation = async () => {
    if (!user) return;
    try {
      const conv = await apiClient.createConversation(user.id, "New Research");
      setConversationId(conv.conversation_id);
      setMessages([]);
      setCurrentKG(null);
      // ✅ Navigate to the new conversation URL
      navigate(`/chat/${conv.conversation_id}`, { replace: true });
    } catch (error: any) {
      console.error("Failed to create conversation:", error);
      toast.error("Failed to create conversation");
    }
  };

  const loadConversation = async (convId: string) => {
  if (!user) return;
  try {
    setIsLoading(true);
    const data = await apiClient.getConversation(convId);
    
    // Convert DB messages to UI format
    const loadedMessages: Message[] = data.messages.map((msg: any) => ({
      role: msg.role === "agent" ? "assistant" : msg.role,
      content: msg.content,
      knowledgeGraph: msg.meta?.kg || undefined,
      results: msg.meta?.results || undefined,
    }));
    
    setMessages(loadedMessages); // ✅ Keep original order (user first, agent second)
    setConversationId(convId);
    
    // ✅ Find last KG without mutating array
    const lastKG = [...loadedMessages]  // Create a copy
      .reverse()
      .find(m => m.knowledgeGraph)?.knowledgeGraph;
    if (lastKG) setCurrentKG(lastKG);
    
  } catch (error) {
    console.error("Failed to load conversation:", error);
    toast.error("Failed to load conversation");
  } finally {
    setIsLoading(false);
  }
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    // ✅ Create conversation if none exists
    let activeConvId = conversationId;
    if (!activeConvId) {
      try {
        const conv = await apiClient.createConversation(user.id, input.slice(0, 50));
        activeConvId = conv.conversation_id;
        setConversationId(activeConvId);
        navigate(`/chat/${activeConvId}`, { replace: true });
      } catch (error) {
        toast.error("Failed to create conversation");
        return;
      }
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Save user message
      await apiClient.sendMessage(activeConvId, "user", userMessage);

      // Run research
      const result = await apiClient.research(userMessage, user.id);

      // Update KG
      const kgData = result.knowledge_graph;
      setCurrentKG(kgData);

      const assistantMessage = `I found ${result.results.length} research results on "${result.topic}". Memory and knowledge graph have been updated with these insights.`;

      // ✅ Save assistant message WITH metadata
      await apiClient.sendMessage(
        activeConvId, 
        "agent", 
        assistantMessage,
        {
          kg: result.knowledge_graph,
          results: result.results
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage,
          knowledgeGraph: result.knowledge_graph,
          results: result.results,
        },
      ]);

      toast.success("Research complete!");
    } catch (error: any) {
      console.error("Research error:", error);
      toast.error(error.message || "Failed to complete research");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered an error while researching. Please make sure the backend API is running and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <QuotaBar used={45} total={100} />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">
                What would you like to research?
              </h2>
              <p className="text-muted-foreground">
                Enter a topic or question below to begin
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div key={idx} className="space-y-4">
              <ChatMessage role={message.role} content={message.content} />

              {message.results && message.results.length > 0 && (
                <div className="space-y-3 ml-12">
                  {message.results.map((item, i) => (
                    <ResearchResult key={i} item={item} />
                  ))}
                </div>
              )}

              {message.knowledgeGraph && (
                <div className="ml-12">
                  <KnowledgeGraphPreview
                    data={message.knowledgeGraph}
                    onViewFull={() => {
                      setCurrentKG(message.knowledgeGraph!);
                      setShowKGModal(true);
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="ml-12">
              <TypingIndicator />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowSchedulerModal(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder="What would you like to research?"
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={(e) => handleSubmit(e as any)}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <KnowledgeGraphModal
        isOpen={showKGModal}
        onClose={() => setShowKGModal(false)}
        data={currentKG}
      />

      <SchedulerModal
        isOpen={showSchedulerModal}
        onClose={() => setShowSchedulerModal(false)}
      />
    </div>
  );
}