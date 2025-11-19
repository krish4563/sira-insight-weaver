import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ResearchResult } from "@/components/ResearchResult";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ResearchItem } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Research() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [researchResults, setResearchResults] = useState<ResearchItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await apiClient.research(userMessage, user.id);
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Found ${result.results.length} research results for "${result.topic}". Results saved to memory and knowledge graph updated.`,
        },
      ]);
      
      setResearchResults(result.results);
      toast.success("Research complete! Memory and KG updated.");
    } catch (error: any) {
      console.error("Research error:", error);
      toast.error(error.message || "Failed to complete research");
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error while researching. Please make sure the backend API is running and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold gradient-text">Research Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Ask me anything and I'll research it for you
        </p>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                <span className="text-3xl">🔍</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">Start Your Research</h2>
              <p className="text-muted-foreground">
                Enter a topic or question below to begin
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <ChatMessage key={idx} role={message.role} content={message.content} />
          ))}

          {isLoading && <TypingIndicator />}

          {researchResults.length > 0 && (
            <div className="space-y-4 mt-6">
              {researchResults.map((item, idx) => (
                <ResearchResult key={idx} item={item} />
              ))}
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
    </div>
  );
}
