import type { Message, SessionMeta } from "./types";

const SESSIONS_KEY = "rag_sessions";
const ACTIVE_KEY = "rag_session_id";
const messagesKey = (id: string) => `rag_messages_${id}`;

export function generateSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `session_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `session_${Math.random().toString(36).slice(2, 10)}`;
}

/** Derive a readable title from the first user prompt. */
export function titleFromPrompt(prompt: string, max = 48): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return "New chat";
  if (cleaned.length <= max) return cleaned;
  const sliced = cleaned.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced).trimEnd() + "…";
}

export function loadSessions(): SessionMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return migrateOrphanedSessions();
    const parsed = JSON.parse(raw) as SessionMeta[];
    if (!Array.isArray(parsed)) return migrateOrphanedSessions();
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: SessionMeta[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function loadMessages(sessionId: string): Message[] {
  const saved = localStorage.getItem(messagesKey(sessionId));
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved) as Message[];
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

export function saveMessages(sessionId: string, messages: Message[]): void {
  if (messages.length === 0) {
    localStorage.removeItem(messagesKey(sessionId));
    return;
  }
  localStorage.setItem(messagesKey(sessionId), JSON.stringify(messages));
}

/** Ensure a session exists in the registry; return the active session list + active id. */
export function bootstrapSessions(): { sessions: SessionMeta[]; activeId: string } {
  let sessions = loadSessions();
  let activeId = getActiveSessionId();

  if (activeId && !sessions.some((s) => s.id === activeId)) {
    const msgs = loadMessages(activeId);
    const firstUser = msgs.find((m) => m.role === "user");
    const now = Date.now();
    sessions = [
      {
        id: activeId,
        title: firstUser ? titleFromPrompt(firstUser.content) : "New chat",
        createdAt: now,
        updatedAt: now,
      },
      ...sessions,
    ];
    saveSessions(sessions);
  }

  if (!activeId || !sessions.some((s) => s.id === activeId)) {
    if (sessions.length > 0) {
      activeId = sessions[0].id;
      setActiveSessionId(activeId);
    } else {
      const created = createSessionMeta();
      sessions = [created];
      saveSessions(sessions);
      activeId = created.id;
      setActiveSessionId(activeId);
    }
  }

  return { sessions, activeId };
}

export function createSessionMeta(title = "New chat"): SessionMeta {
  const now = Date.now();
  return {
    id: generateSessionId(),
    title,
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertSession(
  sessions: SessionMeta[],
  patch: Partial<SessionMeta> & { id: string }
): SessionMeta[] {
  const idx = sessions.findIndex((s) => s.id === patch.id);
  let next: SessionMeta[];
  if (idx === -1) {
    const now = Date.now();
    next = [
      {
        id: patch.id,
        title: patch.title ?? "New chat",
        createdAt: patch.createdAt ?? now,
        updatedAt: patch.updatedAt ?? now,
      },
      ...sessions,
    ];
  } else {
    next = sessions.map((s, i) =>
      i === idx ? { ...s, ...patch, updatedAt: patch.updatedAt ?? Date.now() } : s
    );
  }
  next = next.sort((a, b) => b.updatedAt - a.updatedAt);
  saveSessions(next);
  return next;
}

export function deleteSession(sessions: SessionMeta[], id: string): SessionMeta[] {
  localStorage.removeItem(messagesKey(id));
  const next = sessions.filter((s) => s.id !== id);
  saveSessions(next);
  return next;
}

/** Recover sessions that only exist as message blobs (pre-registry). */
function migrateOrphanedSessions(): SessionMeta[] {
  const recovered: SessionMeta[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("rag_messages_")) continue;
    const id = key.replace("rag_messages_", "");
    const msgs = loadMessages(id);
    if (msgs.length === 0) continue;
    const firstUser = msgs.find((m) => m.role === "user");
    const last = msgs[msgs.length - 1];
    recovered.push({
      id,
      title: firstUser ? titleFromPrompt(firstUser.content) : "New chat",
      createdAt: new Date(msgs[0].timestamp).getTime() || Date.now(),
      updatedAt: new Date(last.timestamp).getTime() || Date.now(),
    });
  }
  recovered.sort((a, b) => b.updatedAt - a.updatedAt);
  if (recovered.length) saveSessions(recovered);
  return recovered;
}
