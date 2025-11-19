import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ResearchResult } from "@/components/ResearchResult";
import { AutomationControls } from "@/components/AutomationControls";
import { KnowledgeGraphPreview } from "@/components/KnowledgeGraphPreview";
import { KnowledgeGraphModal } from "@/components/KnowledgeGraphModal";
import { QuotaBar } from "@/components/QuotaBar";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ResearchItem, KnowledgeGraph } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  showAutomation?: boolean;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await apiClient.research(userMessage, user.id);

      // Fetch updated KG
      const kgData = await apiClient.getKnowledgeGraph();
      setCurrentKG(kgData);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I found ${result.results.length} research results on "${result.topic}". Memory and knowledge graph have been updated with these insights.`,
          showAutomation: true,
          knowledgeGraph: kgData,
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

              {message.showAutomation && user && (
                <div className="ml-12">
                  <AutomationControls
                    topic={messages[idx - 1]?.content || ""}
                    userId={user.id}
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
    </div>
  );
}
