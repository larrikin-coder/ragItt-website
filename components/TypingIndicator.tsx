"use client";

import { motion } from "motion/react";
import styles from "./TypingIndicator.module.css";

export default function TypingIndicator() {
  return (
    <motion.div
      className={styles.wrap}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={styles.typing} aria-label="ragitt is thinking">
        <span />
        <span />
        <span />
      </div>
    </motion.div>
  );
}
