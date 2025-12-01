// /src/components/KnowledgeGraphPreview.tsx
import { Network, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { KnowledgeGraph } from "@/lib/api";

interface KnowledgeGraphPreviewProps {
  data: KnowledgeGraph;
  onViewFull: () => void;
}

export function KnowledgeGraphPreview({
  data,
  onViewFull,
}: KnowledgeGraphPreviewProps) {
  // ✅ Safety checks
  if (!data || !data.counts) {
    return null;
  }

  const nodeCount = data.counts.nodes || 0;
  const edgeCount = data.counts.edges || 0;

  // Don't show if empty
  if (nodeCount === 0 && edgeCount === 0) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Knowledge Graph Updated</p>
              <p className="text-xs text-muted-foreground">
                {nodeCount} entities · {edgeCount} connections
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onViewFull}>
            <span className="mr-1">View Full Graph</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}