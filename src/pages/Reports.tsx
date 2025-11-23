import { useState, useEffect } from "react";
import { FileText, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { apiClient, type Conversation } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Reports() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const data = await apiClient.listConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const handleGenerateReport = async (conversationId: string) => {
    setLoading(true);
    try {
      await apiClient.generateConversationReport(conversationId);
      toast.success("Report generated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (conversationId: string) => {
    toast.info("Preparing download...");
    // Implement download logic using /api/reports/{job_id}
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-border p-4">
        <h1 className="text-2xl font-bold gradient-text">Reports</h1>
        <p className="text-sm text-muted-foreground">
          View and download your research reports
        </p>
      </header>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
              <p className="text-muted-foreground">
                Start a research conversation to generate reports
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Card key={conv.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{conv.topic}</CardTitle>
                        <CardDescription>
                          {new Date(conv.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReport(conv.id)}
                        disabled={loading}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(conv.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
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
