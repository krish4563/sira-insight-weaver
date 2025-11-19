import { useState } from "react";
import { Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface AutomationControlsProps {
  topic: string;
  userId: string;
}

const intervalOptions = [
  { label: "Every 1 hour", value: 3600 },
  { label: "Every 6 hours", value: 21600 },
  { label: "Every 12 hours", value: 43200 },
  { label: "Daily", value: 86400 },
  { label: "Every 2 days", value: 172800 },
  { label: "Weekly", value: 604800 },
];

export function AutomationControls({ topic, userId }: AutomationControlsProps) {
  const [interval, setInterval] = useState<number | null>(null);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!interval) {
      toast.error("Please select an interval");
      return;
    }

    setLoading(true);
    try {
      await apiClient.addScheduledJob(topic, userId, interval);
      toast.success(
        `Research scheduled! ${notifyEnabled ? "Notifications enabled." : ""}`
      );
      setInterval(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule research");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Automate this research?</span>
      </div>

      <div className="space-y-3">
        <Select
          value={interval?.toString()}
          onValueChange={(value) => setInterval(Number(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency..." />
          </SelectTrigger>
          <SelectContent>
            {intervalOptions.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3 w-3 text-muted-foreground" />
            <Label htmlFor="notify" className="text-sm cursor-pointer">
              Notify me when completed
            </Label>
          </div>
          <Switch
            id="notify"
            checked={notifyEnabled}
            onCheckedChange={setNotifyEnabled}
          />
        </div>

        <Button
          onClick={handleSchedule}
          disabled={!interval || loading}
          className="w-full"
        >
          {loading ? "Scheduling..." : "Set Auto Research"}
        </Button>
      </div>
    </div>
  );
}
