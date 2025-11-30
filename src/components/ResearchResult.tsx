// /src/components/ResearchResult.tsx
import { ExternalLink, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { ResearchItem } from "@/lib/api";

interface ResearchResultProps {
  item: ResearchItem;
}

export function ResearchResult({ item }: ResearchResultProps) {
  const credibilityPercentage = Math.round(item.credibility * 100);

  return (
    <Card className="glass-card transition-smooth hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {item.provider}
              </Badge>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline flex items-center gap-1"
              >
                View Source <ExternalLink className="h-3 w-3" />
              </a>
            </CardDescription>
          </div>
          <Badge
            variant={credibilityPercentage >= 70 ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <TrendingUp className="h-3 w-3" />
            {credibilityPercentage}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Credibility Score</p>
          <Progress value={credibilityPercentage} className="h-2" />
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Summary:</p>
          <p className="text-sm text-muted-foreground">{item.summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}
