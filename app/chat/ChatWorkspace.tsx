"use client";

import { useState, useRef, useEffect, KeyboardEvent, startTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "@/components/Sidebar";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import { sendMessage } from "@/lib/api";
import {
  bootstrapSessions,
  createSessionMeta,
  deleteSession,
  loadMessages,
  saveMessages,
  setActiveSessionId,
  titleFromPrompt,
  upsertSession,
} from "@/lib/sessions";
import type { Message, SessionMeta } from "@/lib/types";
import styles from "./ChatWorkspace.module.css";

export default function ChatWorkspace() {
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    const { sessions: list, activeId } = bootstrapSessions();
    setSessions(list);
    setSessionId(activeId);
    setMessages(loadMessages(activeId));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !sessionId || skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveMessages(sessionId, messages);
  }, [messages, sessionId, ready]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function switchSession(id: string) {
    if (id === sessionId) {
      setSidebarOpen(false);
      return;
    }
    skipSaveRef.current = true;
    if (sessionId && messages.length > 0) {
      saveMessages(sessionId, messages);
    }
    setActiveSessionId(id);
    setSessionId(id);
    setMessages(loadMessages(id));
    setSidebarOpen(false);
  }

  function newSession() {
    // Reuse an empty draft instead of stacking blank sessions
    const current = sessions.find((s) => s.id === sessionId);
    if (messages.length === 0 && current?.title === "New chat") {
      setSidebarOpen(false);
      startTransition(() => textareaRef.current?.focus());
      return;
    }

    const emptyDraft = sessions.find(
      (s) => s.title === "New chat" && s.id !== sessionId && loadMessages(s.id).length === 0
    );
    if (emptyDraft) {
      switchSession(emptyDraft.id);
      startTransition(() => textareaRef.current?.focus());
      return;
    }

    if (sessionId && messages.length > 0) {
      saveMessages(sessionId, messages);
    }
    const meta = createSessionMeta();
    const next = upsertSession(sessions, meta);
    setSessions(next);
    skipSaveRef.current = true;
    setActiveSessionId(meta.id);
    setSessionId(meta.id);
    setMessages([]);
    setSidebarOpen(false);
    startTransition(() => textareaRef.current?.focus());
  }

  function handleDeleteSession(id: string) {
    const next = deleteSession(sessions, id);
    setSessions(next);

    if (id !== sessionId) return;

    if (next.length === 0) {
      const meta = createSessionMeta();
      const created = upsertSession([], meta);
      setSessions(created);
      skipSaveRef.current = true;
      setActiveSessionId(meta.id);
      setSessionId(meta.id);
      setMessages([]);
      return;
    }

    const fallback = next[0];
    skipSaveRef.current = true;
    setActiveSessionId(fallback.id);
    setSessionId(fallback.id);
    setMessages(loadMessages(fallback.id));
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  async function handleSend() {
    const query = input.trim();
    if (!query || loading || !sessionId) return;

    const isFirstPrompt = messages.length === 0;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    if (isFirstPrompt) {
      setSessions((prev) =>
        upsertSession(prev, {
          id: sessionId,
          title: titleFromPrompt(query),
          updatedAt: Date.now(),
        })
      );
    } else {
      setSessions((prev) =>
        upsertSession(prev, { id: sessionId, updatedAt: Date.now() })
      );
    }

    try {
      const data = await sendMessage(sessionId, query, webSearch);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        traceEvents: data.trace_events,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSessions((prev) =>
        upsertSession(prev, { id: sessionId, updatedAt: Date.now() })
      );
    } catch (e: unknown) {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: e instanceof Error ? e.message : "Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeTitle =
    sessions.find((s) => s.id === sessionId)?.title ?? "New chat";

  return (
    <div className={styles.layout} suppressHydrationWarning>
      <div
        className={`${styles.sidebarWrap} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <Sidebar
          sessions={sessions}
          activeSessionId={sessionId}
          webSearch={webSearch}
          onWebSearchChange={setWebSearch}
          onNewSession={newSession}
          onSelectSession={switchSession}
          onDeleteSession={handleDeleteSession}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label="Open sessions"
            onClick={() => setSidebarOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className={styles.topbarTitle}>
            <Link href="/" className={styles.topbarBrand}>
              ragitt
            </Link>
            <span className={styles.topbarSep} aria-hidden>
              /
            </span>
            <span className={styles.topbarSession} title={activeTitle}>
              {ready ? activeTitle : "…"}
            </span>
          </div>
        </header>

        <div className={styles.messages}>
          <AnimatePresence mode="wait">
            {ready && messages.length === 0 && !loading && (
              <motion.div
                key="empty"
                className={styles.emptyState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className={styles.emptyTitle}>What would you like to know?</p>
                <p className={styles.emptySub}>
                  Index a PDF in the sidebar, then ask — or let web search fill the gaps.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Ask ragitt…"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={onKeyDown}
              disabled={loading || !ready}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={loading || !ready || !input.trim()}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M2.5 8h11M8.5 3.5 13 8l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className={styles.hint}>Enter to send · Shift+Enter for a new line</p>
        </div>
      </main>
    </div>
  );
}
