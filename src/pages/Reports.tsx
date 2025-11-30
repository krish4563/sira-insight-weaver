// src/pages/Reports.tsx
import { useState, useEffect } from "react";
import { FileText, Download, Eye } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { apiClient, type Conversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const data = await apiClient.listConversations(user.id);
      
      const flattened: Conversation[] = [];
      
      // Flatten the grouped response from backend
      if (data && typeof data === "object") {
        Object.values(data).forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((item: any) => {
              flattened.push({
                id: item.id,
                user_id: user.id,
                // Handle different naming conventions (topic vs title vs topic_title)
                topic_title: item.topic_title || item.title || item.topic || "Untitled Report",
                created_at: item.created_at,
                updated_at: item.updated_at || item.created_at,
              });
            });
          }
        });
      }
      setConversations(flattened);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const handlePreview = async (conversationId: string) => {
    setLoadingId(conversationId);
    try {
      toast.info("Generating preview...");
      // Fetch blob
      const blob = await apiClient.downloadConversationReport(conversationId);
      // Create URL
      const url = window.URL.createObjectURL(blob);
      // Open in new tab
      window.open(url, "_blank");
    } catch (error: any) {
      toast.error("Failed to open preview");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (conversationId: string, title: string) => {
    setLoadingId(conversationId);
    try {
      toast.info("Downloading report...");
      const blob = await apiClient.downloadConversationReport(conversationId);
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      // Sanitize filename
      const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `SIRA_Report_${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Report downloaded");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download report");
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold gradient-text">Research Reports</h1>
        <p className="text-sm text-muted-foreground">
          Preview or download PDFs of your research history
        </p>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No reports available</h2>
              <p className="text-muted-foreground">
                Start a research conversation to generate reports
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Card key={conv.id} className="glass-card hover:bg-muted/30 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        {/* ✅ Correctly displaying the Title */}
                        <CardTitle className="text-lg">{conv.topic_title}</CardTitle>
                        <CardDescription>
                          {new Date(conv.created_at).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* ✅ Preview Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(conv.id)}
                        disabled={loadingId === conv.id}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      
                      {/* ✅ Download Button */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(conv.id, conv.topic_title)}
                        disabled={loadingId === conv.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}