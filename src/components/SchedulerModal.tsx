import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const intervalOptions = [
  { label: "Every 1 hour", value: 3600 },
  { label: "Every 6 hours", value: 21600 },
  { label: "Every 12 hours", value: 43200 },
  { label: "Daily", value: 86400 },
  { label: "Every 2 days", value: 172800 },
  { label: "Weekly", value: 604800 },
];

export function SchedulerModal({ isOpen, onClose }: SchedulerModalProps) {
  const [topic, setTopic] = useState("");
  const [interval, setInterval] = useState<number>(86400);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSchedule = async () => {
    if (!topic.trim() || !user) return;

    setLoading(true);
    try {
      await apiClient.addScheduledJob(topic, user.id, interval);
      toast({
        title: "Research Scheduled",
        description: `Auto-research set for "${topic}"`,
      });
      setTopic("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Auto Research</DialogTitle>
          <DialogDescription>
            Set up automatic research on any topic at your preferred interval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="topic">Research Topic</Label>
            <Input
              id="topic"
              placeholder="Enter topic to research..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="interval">Run Interval</Label>
            <Select value={interval.toString()} onValueChange={(v) => setInterval(Number(v))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={!topic.trim() || loading}>
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
