// Central API configuration for FastAPI backend
// src/lib/api.ts
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
  knowledge_graph: KnowledgeGraph;   
  count: number;                     
}


export interface HealthStatus {
  serpapi: string;
  brave: string;
  ddg: string;
  offline: string;
}

export interface MemoryDoc {
  title: string;
  abstract: string;   // becomes `text` backend
  url: string;
  source: string;     // optional, not used by backend
}



export interface MemorySearchResult {
  score: number;
  text: string;
  url: string;
  title: string;
  id?: string;
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

export interface Conversation {
  id: string;
  user_id: string;
  topic_title: string;  // ✅ Change from "topic" to "topic_title"
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface TimelineReport {
  conversation_id: string;
  topic: string;
  timeline: Array<{
    timestamp: string;
    summary: string;
    changes: string[];
  }>;
  generated_at: string;
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
  const params = new URLSearchParams({
    topic,
    user_id: userId
  });

  return this.request<PipelineResult>(
    `/api/pipeline/research?${params.toString()}`
  );
}



    async upsertMemory(userId: string, doc: MemoryDoc) {
    return this.request<{ id: string }>("/api/memory/add", {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        text: doc.abstract || doc.title,   // fallback if needed
        url: doc.url || "",
        title: doc.title || "",
      }),
    });
  }


   async searchMemory(userId: string, query: string) {
    const res = await this.request<{ matches: MemorySearchResult[] }>(
      `/api/memory/search?user_id=${userId}&q=${encodeURIComponent(query)}`
    );
    return res.matches;
  }


  async getKnowledgeGraph() {
    return this.request<KnowledgeGraph>("/api/kg");
  }

    async addScheduledJob(topic: string, userId: string, intervalSeconds: number) {
    // Backend: POST /api/schedule/start?topic=...&user_id=...&interval_seconds=...
    const params = new URLSearchParams({
      topic,
      user_id: userId,
      interval_seconds: String(intervalSeconds),
    });

    return this.request<{ status: string; job_id: string }>(
      `/api/schedule/start?${params.toString()}`,
      {
        method: "POST",
      }
    );
  }

  async cancelScheduledJob(jobId: string) {
    // Use the existing /api/schedule/cancel which expects job_id in body
    return this.request<{ status: string; job_id: string; success: boolean }>(
      "/api/schedule/cancel",
      {
        method: "POST",
        body: JSON.stringify({ job_id: jobId }),
      }
    );
  }

  async listScheduledJobs(): Promise<ScheduledJob[]> {
    /**
     * Backend returns an object:
     * {
     *   "<job_id>": { topic, user_id, interval or interval_seconds, next_run? },
     *   ...
     * }
     * We convert that into an array of ScheduledJob for the UI.
     */
    const raw = await this.request<
      Record<string, { topic: string; interval?: number; interval_seconds?: number; next_run?: string }>
    >("/api/schedule/list");

    return Object.entries(raw).map(([id, job]) => ({
      id,
      topic: job.topic,
      interval_seconds: job.interval_seconds ?? job.interval ?? 0,
      next_run: job.next_run,
    }));
  }


  // Conversations
 /* -----------------------------
   Conversations API (FIXED)
--------------------------------*/

async createConversation(userId: string, topicTitle: string) {
  return this.request<{ conversation_id: string }>(
    "/api/conversations/start",
    {
      method: "POST",
      body: JSON.stringify({ user_id: userId, topic_title: topicTitle }),
    }
  );
}

async sendMessage(conversationId: string, role: "user" | "agent", content: string, meta?: any) {
  return this.request<{ message_id: string }>(
    `/api/conversations/${conversationId}/message`,
    {
      method: "POST",
      body: JSON.stringify({ role, content, meta }),
    }
  );
}

async listConversations(userId: string) {
  return this.request<{
    today: any[];
    yesterday: any[];
    previous_7_days: any[];
    older: any[];
  }>(`/api/conversations/list?user_id=${encodeURIComponent(userId)}`);
}

async getConversation(conversationId: string, limit: number = 50, offset: number = 0) {
  return this.request<{
    conversation: any;
    messages: any[];
  }>(`/api/conversations/${conversationId}?limit=${limit}&offset=${offset}`);
}

async deleteConversation(conversationId: string) {
  return this.request<{ status: string; conversation_id: string }>(
    `/api/conversations/${conversationId}`,
    { method: "DELETE" }
  );
}

async renameConversation(conversationId: string, newTitle: string) {
  return this.request<{
    status: string;
    conversation_id: string;
    new_title: string;
  }>(`/api/conversations/${conversationId}/rename`, {
    method: "POST",
    body: JSON.stringify({ new_title: newTitle }),
  });
}


  // Reports
  

  async generateConversationReport(conversationId: string) {
    return this.request<{ report_id: string }>(`/api/report/${conversationId}`, {
      method: "POST",
    });
  }

  
    async downloadConversationReport(conversationId: string): Promise<Blob> {
    const headers: HeadersInit = {};

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${this.baseURL}/api/reports/conversation/${conversationId}/download`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.status}`);
    }

    return await response.blob();
  }



  async getScheduleHistory(userId: string) {
    return this.request<any>(`/api/schedule/history?user_id=${userId}`);
  }
}

export const apiClient = new APIClient(API_BASE);
