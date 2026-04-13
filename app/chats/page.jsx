"use client";
import { useState, useEffect, useRef } from "react";
import { EllipsisVertical, Image, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react"; // We need this to know who "me" is

export default function Chats() {
  const { data: session } = useSession();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  // Initialize Socket Connection with userId
  useEffect(() => {
    if (session?.user?.id) {
      // Connect and tell the server who we are
      socketRef.current = io({
        query: { userId: session.user.id },
      });

      // Listen for targeted private messages
      socketRef.current.on("receive-message", (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });

      return () => socketRef.current.disconnect();
    }
  }, [session]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !session?.user?.id) return;

    const messageData = {
      senderId: session.user.id,
      receiverId: "TARGET_USER_ID_HERE", // You'll eventually get this from a sidebar click
      content: input,
    };

    // Send to Socket Server (which saves to MongoDB)
    socketRef.current.emit("send-message", messageData);

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        content: input,
        sender: session.user.id,
        createdAt: new Date(),
      },
    ]);

    setInput("");
  };

  return (
    <div className="w-full h-full flex bg-gray-100 overflow-hidden">
      <div className="flex flex-col flex-1 p-4">
        <div className="w-full flex items-center justify-between border-b border-gray-200 pb-4">
          <h1 className="text-4xl font-bold">
            {session?.user?.unit || "Fisheries Management Unit"}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsInfoOpen(!isInfoOpen)}
          >
            <EllipsisVertical />
          </Button>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === session?.user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-xl ${
                  msg.sender === session?.user?.id
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-white text-black border border-gray-200 rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Row */}
        <div className="w-full flex gap-2">
          <Button type="button" variant="ghost">
            <Image />
          </Button>
          <Button type="button" variant="ghost">
            <Paperclip />
          </Button>
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Sidebar */}
      <div
        className={`h-full bg-white border-l transition-all duration-300 ${isInfoOpen ? "w-[400px] p-6" : "w-0 overflow-hidden"}`}
      >
        <h2 className="text-2xl font-bold mb-4">Unit Information</h2>
        <div className="space-y-2">
          <p>
            <strong>Office:</strong> {session?.user?.office}
          </p>
          <p>
            <strong>Unit:</strong> {session?.user?.unit}
          </p>
        </div>
      </div>
    </div>
  );
}
