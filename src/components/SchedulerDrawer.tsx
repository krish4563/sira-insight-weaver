import { useState, useEffect } from "react";
import { X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient, type ScheduledJob } from "@/lib/api";
import { toast } from "sonner";

interface SchedulerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchedulerDrawer({ isOpen, onClose }: SchedulerDrawerProps) {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadJobs();
    }
  }, [isOpen]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const result = await apiClient.listScheduledJobs();
      setJobs(result.jobs);
    } catch (error: any) {
      toast.error(error.message || "Failed to load scheduled jobs");
    } finally {
      setLoading(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await apiClient.cancelScheduledJob(jobId);
      toast.success("Scheduled job cancelled");
      loadJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel job");
    }
  };

  const formatInterval = (seconds: number) => {
    if (seconds < 3600) return `${seconds / 60} minutes`;
    if (seconds < 86400) return `${seconds / 3600} hours`;
    return `${seconds / 86400} days`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Scheduled Research</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No scheduled research jobs
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-lg border border-border bg-muted/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.topic}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Every {formatInterval(job.interval_seconds)}
                    </p>
                    {job.next_run && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Next: {new Date(job.next_run).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => cancelJob(job.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
