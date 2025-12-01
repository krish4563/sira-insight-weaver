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

    // 1. Basic Validation
    if (!data.nodes || !Array.isArray(data.nodes) || !data.edges || !Array.isArray(data.edges)) {
      setError("Invalid knowledge graph data structure");
      return;
    }

    // 2. DATA SANITATION
    const validNodeIds = new Set(data.nodes.map((n) => n.data.id));
    const cleanEdges = data.edges.filter((e) => {
      return validNodeIds.has(e.data.source) && validNodeIds.has(e.data.target);
    });

    // Limit size for performance
    const limitedNodes = data.nodes.slice(0, 150);
    const limitedEdges = cleanEdges.slice(0, 300);

    try {
      if (cyRef.current) {
        cyRef.current.destroy();
      }

      cyRef.current = cytoscape({
        container: containerRef.current,
        elements: [
            ...limitedNodes, 
            ...limitedEdges
        ],
        style: [
          // 🔵 NODE STYLING
          {
            selector: "node",
            style: {
              "background-color": "#4f46e5", // Indigo-600
              "border-width": 2,
              "border-color": "#ffffff",
              width: 35, 
              height: 35,
              
              // TEXT STYLING
              label: "data(label)",
              color: "#f8fafc", // Slate-50 (Bright White/Grey)
              "font-size": "12px",
              "font-weight": "bold",
              
              // Move text OUTSIDE the node
              "text-valign": "bottom",
              "text-halign": "center",
              "text-margin-y": 8, 
              
              // Text Wrapping & Background
              "text-wrap": "wrap",
              "text-max-width": 120,
              "text-background-color": "#020617", // Matches bg-slate-950
              "text-background-opacity": 0.9,
              "text-background-padding": 4,
              "text-background-shape": "roundrectangle",
            },
          },
          // 🔗 EDGE STYLING (Bold Line + Clear Text)
          {
            selector: "edge",
            style: {
              // Line Style
              width: 3, 
              "line-color": "#64748b", // Slate-500 (Visible but not distracting)
              "target-arrow-color": "#64748b",
              "target-arrow-shape": "triangle",
              "arrow-scale": 1.2,
              "curve-style": "bezier", 
              
              // TEXT STYLING (High Contrast)
              label: "data(label)",
              "font-size": "12px", // Larger size
              "font-weight": "bold",
              color: "#ffffff", // Pure White Text
              
              // Text Background (Hides the line behind text)
              "text-background-color": "#020617", // Matches bg-slate-950
              "text-background-opacity": 1,         // Fully opaque background
              "text-background-padding": 4,         // Space around text
              "text-rotation": "autorotate",        // Follows the line angle
            },
          },
        ],
        layout: {
          name: "cose", 
          animate: false,
          nodeRepulsion: 4500000, 
          idealEdgeLength: 150, 
          componentSpacing: 80,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 50,
          randomize: true, 
        },
      });

      cyRef.current.minZoom(0.2);
      cyRef.current.maxZoom(3);

      setError(null);
    } catch (err: any) {
      console.error("Cytoscape error:", err);
      setError(`Failed to render graph: ${err.message}`);
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
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-6xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-lg">Knowledge Graph</h3>
            {data && (
              <p className="text-sm text-muted-foreground mt-1">
                {data.nodes.length} entities · {data.edges.length} connections
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* ✅ Dark Background (Slate-950) matches text backgrounds */}
        <div className="flex-1 relative bg-slate-950">
            <div ref={containerRef} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}