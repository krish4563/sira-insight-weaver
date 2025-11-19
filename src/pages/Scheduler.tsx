import { useState, useEffect } from "react";
import { Calendar, Trash2, Plus, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiClient, type ScheduledJob } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Scheduler() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newInterval, setNewInterval] = useState("3600");

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.listScheduledJobs();
      setJobs(result.jobs);
    } catch (error: any) {
      toast.error(error.message || "Failed to load scheduled jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !user) return;

    try {
      await apiClient.addScheduledJob(newTopic, user.id, parseInt(newInterval));
      toast.success("Scheduled job added successfully");
      setNewTopic("");
      setNewInterval("3600");
      loadJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to add scheduled job");
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await apiClient.cancelScheduledJob(jobId);
      toast.success("Scheduled job cancelled");
      loadJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel job");
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Research Scheduler</h1>
        <p className="text-muted-foreground">Automate research tasks with scheduled intervals</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Add New Scheduled Research</CardTitle>
          <CardDescription>Create a recurring research task</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddJob} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topic">Research Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., AI advancements"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Interval (seconds)</Label>
                <Input
                  id="interval"
                  type="number"
                  placeholder="3600"
                  value={newInterval}
                  onChange={(e) => setNewInterval(e.target.value)}
                  required
                  min="60"
                />
              </div>
            </div>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Scheduled Job
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Active Scheduled Jobs
          </CardTitle>
          <CardDescription>Manage your automated research tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : jobs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No scheduled jobs yet</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{job.topic}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Every {job.interval_seconds}s
                      </Badge>
                      {job.next_run && (
                        <span className="text-xs text-muted-foreground">
                          Next: {new Date(job.next_run).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCancelJob(job.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
