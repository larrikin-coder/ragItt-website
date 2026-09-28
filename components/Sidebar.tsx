"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { uploadDocument } from "@/lib/api";
import type { SessionMeta } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";
import styles from "./Sidebar.module.css";

interface Props {
  sessions: SessionMeta[];
  activeSessionId: string;
  webSearch: boolean;
  onWebSearchChange: (v: boolean) => void;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onCloseMobile?: () => void;
}

type UploadState = "idle" | "loading" | "success" | "error";

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Sidebar({
  sessions,
  activeSessionId,
  webSearch,
  onWebSearchChange,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  onCloseMobile,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMsg, setUploadMsg] = useState("");

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadState("error");
      setUploadMsg("Only PDF files are supported");
      return;
    }
    setUploadState("loading");
    setUploadMsg(`Uploading ${file.name}…`);
    try {
      const data = await uploadDocument(file);
      setUploadState("success");
      setUploadMsg(data.message);
      setTimeout(() => setUploadState("idle"), 4000);
    } catch (e: unknown) {
      setUploadState("error");
      setUploadMsg(e instanceof Error ? e.message : "Upload failed");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo} onClick={onCloseMobile}>
          <span className={styles.logoMark} aria-hidden />
          <span>
            <span className={styles.logoText}>ragitt</span>
            <span className={styles.logoSub}>workspace</span>
          </span>
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            className={styles.closeMobile}
            aria-label="Close sidebar"
            onClick={onCloseMobile}
          >
            ×
          </button>
        )}
      </div>

      <button type="button" className={styles.newSessionBtn} onClick={onNewSession}>
        <span className={styles.plus} aria-hidden>
          +
        </span>
        New session
      </button>

      <div className={styles.sessionsBlock}>
        <div className={styles.sectionLabel}>Sessions</div>
        <div className={styles.sessionList} role="list">
          <AnimatePresence initial={false}>
            {sessions.length === 0 && (
              <p className={styles.emptySessions}>No sessions yet</p>
            )}
            {sessions.map((s) => {
              const active = s.id === activeSessionId;
              return (
                <motion.div
                  key={s.id}
                  role="listitem"
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className={`${styles.sessionItem} ${active ? styles.sessionActive : ""}`}
                >
                  <button
                    type="button"
                    className={styles.sessionBtn}
                    onClick={() => onSelectSession(s.id)}
                    title={s.title}
                  >
                    <span className={styles.sessionTitle}>{s.title}</span>
                    <span className={styles.sessionMeta}>{formatRelative(s.updatedAt)}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    aria-label={`Delete session ${s.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                  >
                    ×
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className={styles.settingsBlock}>
        <div className={styles.sectionLabel}>Settings</div>
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleName}>Web search</span>
            <span className={styles.toggleDesc}>Live results when docs fall short</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={webSearch}
              onChange={(e) => onWebSearchChange(e.target.checked)}
            />
            <span className={styles.toggleTrack} />
          </label>
        </div>
        <div className={styles.themeRow}>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.uploadBlock}>
        <div className={styles.sectionLabel}>Knowledge base</div>
        <div
          className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className={styles.hiddenInput}
            onChange={onFileChange}
          />
          <div className={styles.uploadText}>
            <strong>Add a PDF</strong>
            <span>Click or drop to index</span>
          </div>
        </div>

        <AnimatePresence>
          {uploadState !== "idle" && (
            <motion.div
              key={uploadState}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`${styles.uploadStatus} ${styles[uploadState]}`}
            >
              {uploadMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.footer}>ragitt · grounded answers</div>
    </aside>
  );
}
