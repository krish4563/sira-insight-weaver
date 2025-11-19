import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface QuotaBarProps {
  used: number;
  total: number;
}

export function QuotaBar({ used, total }: QuotaBarProps) {
  const percentage = (used / total) * 100;
  const remaining = total - used;

  return (
    <div className="border-b border-border bg-card/50 px-4 py-2">
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <Zap className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <Progress value={percentage} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground">
          {remaining} credits remaining
        </span>
      </div>
    </div>
  );
}
