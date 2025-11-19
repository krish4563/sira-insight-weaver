import { useState } from "react";
import { Search, Database, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiClient, type MemorySearchResult } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Memory() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemorySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !user) return;

    setIsLoading(true);
    try {
      const data = await apiClient.searchMemory(user.id, query, 10);
      setResults(data);
      toast.success(`Found ${data.length} results`);
    } catch (error: any) {
      toast.error(error.message || "Failed to search memory");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Memory Viewer</h1>
        <p className="text-muted-foreground">
          Search through your research history stored in Pinecone
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Search Memory
          </CardTitle>
          <CardDescription>Query your stored research documents</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search for topics, keywords, or concepts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>
          {results.map((result, idx) => (
            <Card key={idx} className="glass-card transition-smooth hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{result.doc.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <Badge variant="outline" className="mr-2">
                        {result.doc.source}
                      </Badge>
                      <a
                        href={result.doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline inline-flex items-center gap-1"
                      >
                        View Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    Score: {(result.score * 100).toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.doc.abstract}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
