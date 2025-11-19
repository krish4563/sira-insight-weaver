import { FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Reports() {
  // This will be populated with actual data from the backend
  const mockReports = [
    {
      id: 1,
      title: "AI Ethics in Healthcare",
      date: "2025-01-15",
      citations: 12,
      status: "complete",
    },
    {
      id: 2,
      title: "Quantum Computing Applications",
      date: "2025-01-14",
      citations: 8,
      status: "complete",
    },
  ];

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Research Reports</h1>
        <p className="text-muted-foreground">View and export your generated reports</p>
      </div>

      {mockReports.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No reports yet</p>
            <p className="text-sm text-muted-foreground">
              Start a research query to generate your first report
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {mockReports.map((report) => (
            <Card key={report.id} className="glass-card transition-smooth hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{report.title}</CardTitle>
                    <CardDescription>
                      Generated on {new Date(report.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge>{report.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {report.citations} citations
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" onClick={() => toast.info("PDF generation coming soon")}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
