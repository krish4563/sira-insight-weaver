// src/components/ResearchResult.tsx
import { ExternalLink, ShieldCheck, ShieldAlert, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ResearchItem } from "@/lib/api";

interface ResearchResultProps {
  item: ResearchItem;
  index?: number; // ✅ Add optional index prop for citations
}

export function ResearchResult({ item, index }: ResearchResultProps) {
  const getCredibilityColor = (score: number) => {
    if (score >= 0.8) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (score >= 0.5) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const score = item.credibility ?? 0.5;

  return (
    <Card className="p-3 bg-card/50 hover:bg-card/80 transition-colors border border-border/50 group">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* ✅ Citation Number Badge */}
            {index && (
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-primary text-xs font-mono font-bold">
                {index}
              </span>
            )}
            
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-primary truncate transition-colors flex items-center gap-1.5"
            >
              <Globe className="h-3 w-3 opacity-50" />
              <span className="truncate">{item.title || "Untitled Source"}</span>
            </a>
          </div>
          
          <Badge 
            variant="outline" 
            className={`h-5 px-1.5 text-[10px] gap-1 font-normal ${getCredibilityColor(score)}`}
          >
            {score >= 0.7 ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {Math.round(score * 100)}%
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 pl-7">
          {item.summary || "No summary available for this source."}
        </p>
        
        <div className="flex items-center justify-between pl-7 mt-1">
           <span className="text-[10px] text-muted-foreground uppercase tracking-wider opacity-70">
             {item.provider || "Web"}
           </span>
           <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
           >
             <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
           </a>
        </div>
      </div>
    </Card>
  );
}