"use client";

import type { TraceEvent } from "@/lib/types";
import styles from "./TraceBar.module.css";

const chipClass: Record<string, string> = {
  router_decision: styles.chipRouter,
  rag_action: styles.chipRag,
  web_action: styles.chipWeb,
  answer_generation: styles.chipAnswer,
};

function chipLabel(ev: TraceEvent): string {
  if (ev.event_type === "router_decision") {
    return "route · " + (ev.details?.decision || ev.details?.final_decision || "decide");
  }
  if (ev.event_type === "rag_action") {
    return "docs · " + (ev.details?.sufficiency_verdict || "retrieve");
  }
  if (ev.event_type === "web_action") return "web · search";
  if (ev.event_type === "answer_generation") return "answer";
  return ev.node_name || ev.event_type;
}

export default function TraceBar({ events }: { events: TraceEvent[] }) {
  if (!events?.length) return null;

  return (
    <div className={styles.bar}>
      {events.map((ev) => (
        <span
          key={ev.step}
          title={ev.description}
          className={`${styles.chip} ${chipClass[ev.event_type] || styles.chipRouter}`}
        >
          {chipLabel(ev)}
        </span>
      ))}
    </div>
  );
}
