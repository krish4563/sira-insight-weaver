import { useState, useEffect } from "react";
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentKG, setCurrentKG] = useState<KnowledgeGraph | null>(null);
  const [showKGModal, setShowKGModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Create new conversation on component mount
  useEffect(() => {
    if (user) {
      handleNewConversation();
    }
  }, [user]);

  const handleNewConversation = async () => {
    if (!user) return;
    try {
      const conv = await apiClient.createConversation(user.id, "New Research");
      setConversationId(conv.id);
      setMessages([]);
      setCurrentKG(null);
    } catch (error: any) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user || !conversationId) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Save user message to conversation
      await apiClient.addConversationMessage(conversationId, "user", userMessage);

      // Run research
      const result = await apiClient.research(userMessage, user.id);

      // Update KG
      const kgData = result.knowledge_graph;
      setCurrentKG(kgData);

      const assistantMessage = `I found ${result.results.length} research results on "${result.topic}". Memory and knowledge graph have been updated with these insights.`;

      // Save assistant message to conversation
      await apiClient.addConversationMessage(conversationId, "assistant", assistantMessage);

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
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
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
            placeholder="What would you like to research?"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
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
