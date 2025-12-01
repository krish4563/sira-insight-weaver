// /src/components/KnowledgeGraphModal.tsx
import { useEffect, useRef, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import cytoscape from "cytoscape";
import type { KnowledgeGraph } from "@/lib/api";

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: KnowledgeGraph | null;
}

export function KnowledgeGraphModal({
  isOpen,
  onClose,
  data,
}: KnowledgeGraphModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !data || !containerRef.current) return;

    // ✅ Safety checks
    if (!data.nodes || !Array.isArray(data.nodes) || 
        !data.edges || !Array.isArray(data.edges)) {
      setError("Invalid knowledge graph data");
      return;
    }

    // ✅ Size limit protection
    const nodeCount = data.nodes.length;
    const edgeCount = data.edges.length;
    
    if (nodeCount > 100) {
      setError(`Too many nodes (${nodeCount}). Showing first 100 entities.`);
    }
    
    if (edgeCount > 200) {
      setError(`Too many edges (${edgeCount}). Showing first 200 connections.`);
    }

    // ✅ Limit data for performance
    const limitedNodes = data.nodes.slice(0, 100);
    const limitedEdges = data.edges.slice(0, 200);

    try {
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [...limitedNodes, ...limitedEdges],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "hsl(var(--primary))",
              label: "data(label)",
              color: "hsl(var(--foreground))",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "12px",
              width: 40,
              height: 40,
            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "hsl(var(--muted-foreground))",
              "target-arrow-color": "hsl(var(--muted-foreground))",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              label: "data(label)",
              "font-size": "10px",
              color: "hsl(var(--muted-foreground))",
            },
          },
        ],
        layout: {
          name: "cose",
          animate: true,
          animationDuration: 500,
          nodeRepulsion: 400000,
          idealEdgeLength: 100,
        },
      });

      setError(null);
    } catch (err) {
      console.error("Cytoscape error:", err);
      setError("Failed to render knowledge graph");
    }

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-5xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-lg">Knowledge Graph</h3>
            {data && data.counts && (
              <p className="text-sm text-muted-foreground mt-1">
                {data.counts.nodes || 0} nodes · {data.counts.edges || 0} connections
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="p-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div ref={containerRef} className="flex-1 bg-muted/20" />
      </div>
    </div>
  );
}