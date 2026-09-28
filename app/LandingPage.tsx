"use client";

import Link from "next/link";
import { motion } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";
import { WovenLightPanel } from "@/components/ui/woven-light-hero";
import styles from "./page.module.css";

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.1, duration: 0.7, ease: easeOut },
  }),
};

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.atmosphere} aria-hidden>
        <div className={styles.blobA} />
        <div className={styles.blobB} />
        <div className={styles.grain} />
      </div>

      <header className={styles.nav}>
        <motion.span
          className={styles.navBrand}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          ragitt
        </motion.span>
        <motion.div
          className={styles.navActions}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <ThemeToggle compact />
          <Link href="/chat" className={styles.navLink}>
            Open workspace
          </Link>
        </motion.div>
      </header>

      <main className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <motion.h1
              className={styles.brand}
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              ragitt
            </motion.h1>

            <motion.p
              className={styles.headline}
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              Answers with memory.
            </motion.p>

            <motion.p
              className={styles.sub}
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              Ground every reply in your PDFs and the live web — quietly, clearly, without the noise.
            </motion.p>

            <motion.div
              className={styles.ctaGroup}
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="show"
            >
              <Link href="/chat" className={styles.ctaPrimary}>
                Start a session
              </Link>
              <a href="#how" className={styles.ctaGhost}>
                How it works
              </a>
            </motion.div>
          </div>

          <div className={styles.heroVisual}>
            <WovenLightPanel />
          </div>
        </div>
      </main>

      <section id="how" className={styles.how}>
        <motion.div
          className={styles.howInner}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          <h2 className={styles.howTitle}>One place for grounded research</h2>
          <p className={styles.howSub}>
            Upload a document, ask in plain language, and watch the pipeline retrieve, verify, and
            answer.
          </p>
          <ul className={styles.steps}>
            <li>
              <span className={styles.stepNum}>01</span>
              <span>
                <strong>Index</strong>
                Drop a PDF into your knowledge base.
              </span>
            </li>
            <li>
              <span className={styles.stepNum}>02</span>
              <span>
                <strong>Ask</strong>
                Sessions keep context — titled from your first prompt.
              </span>
            </li>
            <li>
              <span className={styles.stepNum}>03</span>
              <span>
                <strong>Trace</strong>
                See whether the answer came from your docs or the web.
              </span>
            </li>
          </ul>
        </motion.div>
      </section>

      <footer className={styles.footer}>
        <span>ragitt</span>
        <span className={styles.footerMuted}>Documents · retrieval · clarity</span>
      </footer>
    </div>
  );
}
