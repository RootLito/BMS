"use client";
import Nav from "@/components/nav";
import { ChatProvider } from "@/context/ChatContext";

export default function Layout({ children }) {
  return (
    <ChatProvider>
      <div className="w-full h-screen flex flex-col bg-gray-100 font-sans text-slate-900">
        <Nav />
        {children}
      </div>
    </ChatProvider>
  );
}
