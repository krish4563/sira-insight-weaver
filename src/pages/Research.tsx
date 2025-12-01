// src/pages/Research.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Plus, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
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
  isStreaming?: boolean; // ✅ Added to track streaming state
}

export default function Research() {
  const { user } = useAuth();
  const { conversationId: urlConversationId } = useParams();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [currentKG, setCurrentKG] = useState<KnowledgeGraph | null>(null);
  const [showKGModal, setShowKGModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const isLoadingRef = useRef(false);
  const hasInitialized = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null); // To auto-scroll

  // ✅ Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ✅ Load conversation from URL
  useEffect(() => {
    if (!user) return;
  
    const initializeConversation = async () => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        if (urlConversationId) {
          // If we are already on this chat and have messages, don't reload (Optimistic fix)
          if (conversationId === urlConversationId && messages.length > 0) {
             return;
          }
          if (conversationId !== urlConversationId) {
             await loadConversation(urlConversationId);
          }
        } else {
          // Root URL: Reset State
          setMessages([]);
          setCurrentKG(null);
          setConversationId(null);

          if (window.location.pathname === "/" && !hasInitialized.current) {
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
      const conv = await apiClient.createConversation(user.id, "New Chat");
      setConversationId(conv.conversation_id);
      setMessages([]);
      setCurrentKG(null);
      navigate(`/chat/${conv.conversation_id}`, { replace: true });
    } catch (error: any) {
      console.error("Failed to create conversation:", error);
    }
  };

  const loadConversation = async (convId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await apiClient.getConversation(convId);
      
      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        role: msg.role === "agent" ? "assistant" : msg.role,
        content: msg.content,
        knowledgeGraph: msg.meta?.kg || undefined,
        results: msg.meta?.results || undefined,
      }));
      
      setMessages(loadedMessages);
      setConversationId(convId);
      
      const lastKG = [...loadedMessages]
        .reverse()
        .find(m => m.knowledgeGraph)?.knowledgeGraph;
      if (lastKG) setCurrentKG(lastKG);
      
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ VISUAL STREAMING LOGIC (The Typewriter Effect)
  const streamResponse = async (fullText: string, metadata: any) => {
    // 1. Add an empty assistant message
    setMessages(prev => [
      ...prev,
      { 
        role: "assistant", 
        content: "", 
        isStreaming: true,
        knowledgeGraph: metadata.kg,
        results: metadata.results 
      }
    ]);

    // 2. Type it out chunk by chunk
    let currentText = "";
    const chunkSize = 3; // Characters per tick (adjust for speed)
    
    for (let i = 0; i < fullText.length; i += chunkSize) {
      currentText += fullText.slice(i, i + chunkSize);
      
      setMessages(prev => {
        const newArr = [...prev];
        const lastIdx = newArr.length - 1;
        // Update the last message content
        newArr[lastIdx] = { ...newArr[lastIdx], content: currentText };
        return newArr;
      });
      
      // Speed: 15ms delay = fast but readable typing
      await new Promise(r => setTimeout(r, 15));
    }

    // 3. Mark streaming as done
    setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1].isStreaming = false;
        return newArr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // 1. OPTIMISTIC UPDATE: Show User Message Instantly
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    let activeConvId = conversationId;
    let isNewChat = false;

    // 2. Create Chat if needed
    if (!activeConvId) {
      try {
        isNewChat = true;
        const conv = await apiClient.createConversation(user.id, "New Chat");
        activeConvId = conv.conversation_id;
        setConversationId(activeConvId);
        // Silent navigation to avoid reloading
        navigate(`/chat/${activeConvId}`, { replace: true });
      } catch (error) {
        toast.error("Failed to create conversation");
        setIsLoading(false);
        return;
      }
    }

    try {
      // 3. Send User Message to Backend
      await apiClient.sendMessage(activeConvId, "user", userMessage);

      // 4. Run Research Pipeline (Time consuming step)
      const result: any = await apiClient.research(userMessage, user.id, activeConvId, deepResearch);

      // Update State
      setCurrentKG(result.knowledge_graph);
      setIsLoading(false); // Stop loading indicator, start streaming

      const assistantContent = result.answer || `I found ${result.results.length} results.`;

      // 5. Save Assistant Message to Backend (So it persists)
      await apiClient.sendMessage(
        activeConvId, 
        "agent", 
        assistantContent,
        {
          kg: result.knowledge_graph,
          results: result.results
        }
      );

      // 6. ✅ START STREAMING EFFECT
      await streamResponse(assistantContent, {
          kg: result.knowledge_graph,
          results: result.results
      });

    } catch (error: any) {
      console.error("Research error:", error);
      toast.error("Failed to complete research");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error while researching. Please check the backend connection.",
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <QuotaBar used={45} total={100} />

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
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
            <div key={idx} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Main Chat Bubble */}
              <ChatMessage role={message.role} content={message.content} />

              {/* References Section (Only show when streaming finishes OR if results exist) */}
              {message.role === "assistant" && message.results && message.results.length > 0 && !message.isStreaming && (
                <div className="ml-12 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>References & Sources</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {message.results.map((item, i) => (
                      <ResearchResult key={i} item={item} index={i + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* KG Preview (Only show when streaming finishes) */}
              {message.knowledgeGraph && !message.isStreaming && (
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

          {/* Loading Indicator (Only while backend is thinking, before streaming starts) */}
          {isLoading && (
            <div className="ml-12">
              <TypingIndicator />
            </div>
          )}
          
          {/* Invisible div to auto-scroll to */}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-4 bg-background/80 backdrop-blur">
        <div className="max-w-4xl mx-auto space-y-3">
          
          <div className="flex items-center space-x-2 pl-1">
            <Switch 
              id="deep-mode" 
              checked={deepResearch}
              onCheckedChange={setDeepResearch}
            />
            <Label htmlFor="deep-mode" className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Sparkles className={`h-3 w-3 ${deepResearch ? "text-primary" : ""}`} />
              Deep Research Mode {deepResearch && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Active</span>}
            </Label>
          </div>

          <div className="flex gap-2">
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
              disabled={isLoading || messages.some(m => m.isStreaming)}
              className="flex-1"
            />
            <Button 
              onClick={(e) => handleSubmit(e as any)}
              disabled={isLoading || !input.trim() || messages.some(m => m.isStreaming)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
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