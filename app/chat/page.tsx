import type { Metadata } from "next";
import ChatWorkspace from "./ChatWorkspace";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Chat with ragitt — grounded answers from your documents and the web.",
};

export default function ChatPage() {
  return <ChatWorkspace />;
}
