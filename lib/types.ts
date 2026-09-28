export interface TraceEvent {
  step: number;
  node_name: string | null;
  description: string;
  details: Record<string, string>;
  event_type: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  traceEvents?: TraceEvent[];
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  trace_events: TraceEvent[];
}

export interface UploadResponse {
  message: string;
  filename: string;
  processed_chunks: number;
}

export interface SessionMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}