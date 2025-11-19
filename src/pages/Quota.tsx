import { BarChart3, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Quota() {
  // Placeholder data - will be connected to backend
  const quotaData = {
    apiCalls: { used: 1250, limit: 5000 },
    memoryStorage: { used: 2.3, limit: 10, unit: "GB" },
    scheduledJobs: { active: 3, limit: 10 },
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Usage & Quota</h1>
        <p className="text-muted-foreground">Monitor your SIRA resource consumption</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              API Calls
            </CardTitle>
            <CardDescription>Monthly request quota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {quotaData.apiCalls.used.toLocaleString()}
              <span className="text-lg text-muted-foreground font-normal">
                {" "}/ {quotaData.apiCalls.limit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={(quotaData.apiCalls.used / quotaData.apiCalls.limit) * 100} 
              className="h-2"
            />
            <Badge variant="outline">
              {((quotaData.apiCalls.used / quotaData.apiCalls.limit) * 100).toFixed(1)}% used
            </Badge>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-accent" />
              Memory Storage
            </CardTitle>
            <CardDescription>Pinecone vector storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {quotaData.memoryStorage.used}
              <span className="text-lg text-muted-foreground font-normal">
                {" "}{quotaData.memoryStorage.unit} / {quotaData.memoryStorage.limit} {quotaData.memoryStorage.unit}
              </span>
            </div>
            <Progress 
              value={(quotaData.memoryStorage.used / quotaData.memoryStorage.limit) * 100} 
              className="h-2"
            />
            <Badge variant="outline">
              {((quotaData.memoryStorage.used / quotaData.memoryStorage.limit) * 100).toFixed(1)}% used
            </Badge>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Scheduled Jobs
            </CardTitle>
            <CardDescription>Active automation tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {quotaData.scheduledJobs.active}
              <span className="text-lg text-muted-foreground font-normal">
                {" "}/ {quotaData.scheduledJobs.limit}
              </span>
            </div>
            <Progress 
              value={(quotaData.scheduledJobs.active / quotaData.scheduledJobs.limit) * 100} 
              className="h-2"
            />
            <Badge variant="outline">
              {((quotaData.scheduledJobs.active / quotaData.scheduledJobs.limit) * 100).toFixed(1)}% used
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Usage Timeline</CardTitle>
          <CardDescription>Historical resource consumption (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Usage analytics and charts will be available here</p>
        </CardContent>
      </Card>
    </div>
  );
}
