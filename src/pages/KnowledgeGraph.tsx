import { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function KnowledgeGraph() {
  const cyRef = useRef<Core | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0 });

  const loadGraph = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getKnowledgeGraph();
      
      if (cyRef.current) {
        cyRef.current.elements().remove();
        
        // Add nodes - data already in Cytoscape format
        data.nodes.forEach((node) => {
          cyRef.current?.add({ group: "nodes", ...node });
        });

        // Add edges - data already in Cytoscape format
        data.edges.forEach((edge) => {
          cyRef.current?.add({ group: "edges", ...edge });
        });

        // Run layout
        cyRef.current
          ?.layout({
            name: "cose",
            animate: true,
            animationDuration: 500,
          })
          .run();
        
        setGraphStats(data.counts);
      }
      
      toast.success(`Knowledge graph loaded: ${data.counts.nodes} nodes, ${data.counts.edges} edges`);
    } catch (error: any) {
      console.error("Failed to load graph:", error);
      toast.error(error.message || "Failed to load knowledge graph");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "hsl(263, 85%, 65%)",
            label: "data(label)",
            color: "hsl(240, 5%, 96%)",
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
            "line-color": "hsl(177, 85%, 60%)",
            "target-arrow-color": "hsl(177, 85%, 60%)",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "10px",
            color: "hsl(240, 5%, 64%)",
          },
        },
      ],
      layout: { name: "cose" },
    });

    loadGraph();

    return () => {
      cyRef.current?.destroy();
    };
  }, []);

  return (
    <div className="container max-w-full h-screen py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Knowledge Graph</h1>
          <p className="text-muted-foreground">
            Interactive visualization of research entities and relationships
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {graphStats.nodes} nodes • {graphStats.edges} edges
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button onClick={loadGraph} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-card p-0 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <div ref={containerRef} className="w-full h-full" />
      </Card>
    </div>
  );
}
