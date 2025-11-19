import { FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// Mock data - replace with actual API call
const mockReports = [
  {
    id: "1",
    title: "AI Research Trends Q1 2024",
    date: "2024-03-15",
    size: "2.4 MB",
  },
  {
    id: "2",
    title: "Quantum Computing Analysis",
    date: "2024-03-10",
    size: "1.8 MB",
  },
  {
    id: "3",
    title: "Climate Studies Overview",
    date: "2024-03-05",
    size: "3.1 MB",
  },
];

export default function Reports() {
  const handleDownload = (reportId: string) => {
    toast.success("Download started");
    // Implement actual download logic
  };

  const handleView = (reportId: string) => {
    toast.info("Opening PDF viewer");
    // Implement actual view logic
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
          {mockReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No reports yet</h2>
              <p className="text-muted-foreground">
                Your generated PDF reports will appear here
              </p>
            </div>
          ) : (
            mockReports.map((report) => (
              <Card key={report.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription>
                          {new Date(report.date).toLocaleDateString()} · {report.size}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(report.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(report.id)}
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
