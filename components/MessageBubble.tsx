"use client";

import { motion } from "motion/react";
import type { Message } from "@/lib/types";
import TraceBar from "./TraceBar";
import styles from "./MessageBubble.module.css";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`${styles.wrap} ${isUser ? styles.user : styles.assistant}`}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
        {message.content}
      </div>

      {!isUser && message.traceEvents && <TraceBar events={message.traceEvents} />}
    </motion.div>
  );
}
