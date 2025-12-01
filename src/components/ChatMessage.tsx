// src/components/ChatMessage.tsx
import { User, Bot, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // ✅ Ensure this is installed: npm install remark-gfm

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      
      <Card
        className={`max-w-[80%] p-4 relative group ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "glass-card"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>

        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap pr-8">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]} 
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-1 mt-2" {...props} />,
                p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="text-sm" {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline ? (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props} />
                  ) : (
                    <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto" {...props} />
                  ),
                a: ({node, ...props}) => (
                  <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),
                // Table Styles
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4 rounded-md border border-border">
                    <table className="w-full text-sm text-left" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-muted/50 text-xs uppercase" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-2 font-semibold border-b border-border" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-2 border-b border-border/50" {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </Card>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}