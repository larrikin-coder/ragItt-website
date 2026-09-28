import type { Metadata } from "next";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  title: "ragitt",
  description:
    "ragitt — ask with context. Ground answers in your documents and the live web.",
};

export default function Home() {
  return <LandingPage />;
}
