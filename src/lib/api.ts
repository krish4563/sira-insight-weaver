// Central API configuration for FastAPI backend
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export interface ResearchItem {
  title: string;
  url: string;
  summary: string;
  credibility: number;
  provider: string;
}

export interface PipelineResult {
  topic: string;
  results: ResearchItem[];
}

export interface HealthStatus {
  serpapi: string;
  brave: string;
  ddg: string;
  offline: string;
}

export interface MemoryDoc {
  title: string;
  abstract: string;
  url: string;
  source: string;
}

export interface MemorySearchResult {
  score: number;
  doc: MemoryDoc;
}

export interface KnowledgeGraphNode {
  data: {
    id: string;
    label: string;
    type: string;
  };
}

export interface KnowledgeGraphEdge {
  data: {
    source: string;
    target: string;
    label: string;
  };
}

export interface KnowledgeGraph {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  counts: {
    nodes: number;
    edges: number;
  };
}

export interface ScheduledJob {
  id: string;
  topic: string;
  interval_seconds: number;
  next_run?: string;
}

class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async health() {
    return this.request<{ ok: boolean }>("/health");
  }

  async pipelineHealth() {
    return this.request<HealthStatus>("/api/pipeline/health");
  }

  async research(topic: string, userId: string) {
    return this.request<PipelineResult>("/api/pipeline/research", {
      method: "POST",
      body: JSON.stringify({ topic, user_id: userId }),
    });
  }

  async upsertMemory(userId: string, doc: MemoryDoc) {
    return this.request<{ ok: boolean; count: number }>("/api/memory/upsert", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, ...doc }),
    });
  }

  async searchMemory(userId: string, query: string, k: number = 5) {
    return this.request<MemorySearchResult[]>(
      `/api/memory/search?user_id=${userId}&q=${encodeURIComponent(query)}&k=${k}`
    );
  }

  async getKnowledgeGraph() {
    return this.request<KnowledgeGraph>("/api/kg");
  }

  async addScheduledJob(topic: string, userId: string, intervalSeconds: number) {
    return this.request<{ ok: boolean; job_id: string }>("/api/schedule/add", {
      method: "POST",
      body: JSON.stringify({ topic, user_id: userId, interval_seconds: intervalSeconds }),
    });
  }

  async cancelScheduledJob(jobId: string) {
    return this.request<{ ok: boolean }>("/api/schedule/cancel", {
      method: "POST",
      body: JSON.stringify({ job_id: jobId }),
    });
  }

  async listScheduledJobs() {
    return this.request<{ jobs: ScheduledJob[] }>("/api/schedule/list");
  }
}

export const apiClient = new APIClient(API_BASE);
