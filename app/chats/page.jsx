"use client";
import { useState, useEffect, useRef } from "react";
import {
  EllipsisVertical,
  Image as ImageIcon,
  Paperclip,
  Send,
  MessageSquare,
  FileText,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { useSocket } from "@/context/SocketContext";
import { useChat } from "@/context/ChatContext";

export default function Chats() {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { selectedUser } = useChat();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Fetch History when user changes
  useEffect(() => {
    if (!selectedUser?._id) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${selectedUser._id}`);
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    setSelectedFiles([]);
  }, [selectedUser?._id]);

  // Receive messages
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const isFromSelected = String(msg.sender) === String(selectedUser?._id);
      const isFromMe = String(msg.sender) === String(session?.user?.id);

      if (isFromSelected || isFromMe) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;

          // Map files for proper rendering
          const files = (msg.files || []).map((f) => ({
            ...f,
            fileType: f.fileType.startsWith("image")
              ? "image"
              : f.fileType.startsWith("video")
                ? "video"
                : "file",
          }));

          return [
            ...prev.filter((m) => !m._id?.startsWith("temp-")),
            { ...msg, files },
          ];
        });
      }
    };

    socket.on("receive-message", handleReceive);
    return () => socket.off("receive-message", handleReceive);
  }, [socket, selectedUser?._id, session?.user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (
      (!input.trim() && selectedFiles.length === 0) ||
      isUploading ||
      !selectedUser ||
      !socket
    )
      return;

    const currentInput = input;
    const currentFiles = [...selectedFiles];
    setInput("");
    setSelectedFiles([]);

    let uploadedFilesData = [];
    if (currentFiles.length > 0) {
      setIsUploading(true);
      try {
        const uploadPromises = currentFiles.map(async (item) => {
          const formData = new FormData();
          formData.append("file", item.file);
          const res = await fetch("/api/messages/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          return {
            url: data.url,
            fileName: data.fileName || data.name,
            fileType: data.type.startsWith("image")
              ? "image"
              : data.type.startsWith("video")
                ? "video"
                : "file",
            mimeType: data.type,
          };
        });
        uploadedFilesData = await Promise.all(uploadPromises);
      } catch (err) {
        console.error(err);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const messageData = {
      senderId: session.user.id,
      receiverId: selectedUser._id,
      content: currentInput,
      files: uploadedFilesData,
    };

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        sender: session.user.id,
        createdAt: new Date(),
        _id: tempId,
        files: uploadedFilesData,
      },
    ]);

    // Emit message
    socket.emit("send-message", messageData);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) return alert("Max 10 files.");

    const filesWithPreview = files.map((file) => ({
      file,
      preview:
        file.type.startsWith("image") || file.type.startsWith("video")
          ? URL.createObjectURL(file)
          : null,
      name: file.name,
      type: file.type,
      fileType: file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
          ? "video"
          : "file",
    }));

    setSelectedFiles((prev) => [...prev, ...filesWithPreview]);
  };

  return (
    <div className="w-full h-full flex bg-slate-50 overflow-hidden font-sans">
      <div className="flex flex-col flex-1 relative">
        <div className="w-full flex items-center justify-between bg-white border-b p-4 px-6">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800">
              {selectedUser ? selectedUser.fullname : "Select Personnel"}
            </h1>
            {selectedUser && (
              <span className="text-xs text-green-500 font-medium">
                Active Now
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsInfoOpen(!isInfoOpen)}
          >
            <EllipsisVertical className="w-5 h-5 text-slate-600" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
              <MessageSquare size={64} strokeWidth={1} className="opacity-20" />
              <p className="font-medium text-sm">
                Select a personnel to start a conversation
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = String(msg.sender) === String(session?.user?.id);
              return (
                <div
                  key={msg._id || idx}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    <div
                      className={`p-3 rounded-2xl shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"}`}
                    >
                      {msg.files?.map((f, i) => (
                        <div
                          key={i}
                          className="mb-2 rounded-lg overflow-hidden border bg-black/5"
                        >
                          {f.fileType === "image" && (
                            <img
                              src={f.url}
                              className="w-full max-h-60 object-cover"
                            />
                          )}
                          {f.fileType === "video" && (
                            <video
                              controls
                              className="w-full max-h-60 object-cover"
                            >
                              <source
                                src={f.url}
                                type={f.mimeType || "video/mp4"}
                              />
                            </video>
                          )}
                          {f.fileType === "file" && (
                            <a
                              href={f.url}
                              target="_blank"
                              className="flex items-center gap-3 p-3 text-xs"
                            >
                              <FileText className="text-blue-500" />
                              <span className="truncate">{f.fileName}</span>
                              <Download size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                      {msg.content && (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    <span className="text-[10px] opacity-40 font-bold uppercase">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {selectedFiles.length > 0 && (
          <div className="w-full bg-white border-t border-blue-100 p-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {selectedFiles.map((item, i) => (
                <div
                  key={i}
                  className="relative min-w-[100px] h-[100px] rounded-xl border bg-slate-50 overflow-hidden"
                >
                  {item.preview ? (
                    item.fileType === "image" ? (
                      <img
                        src={item.preview}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.preview}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <FileText className="m-auto mt-8 text-blue-500" />
                  )}
                  <button
                    onClick={() =>
                      setSelectedFiles((prev) =>
                        prev.filter((_, idx) => idx !== i),
                      )
                    }
                    className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full bg-white border-t p-4 flex items-center gap-2 z-20">
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            type="file"
            ref={docInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={!selectedUser || isUploading}
          >
            <ImageIcon className="text-blue-500 w-5 h-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => docInputRef.current?.click()}
            disabled={!selectedUser || isUploading}
          >
            <Paperclip className="text-blue-500 w-5 h-5" />
          </Button>
          <Input
            placeholder={isUploading ? "Sending..." : "Write a message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={!selectedUser || isUploading}
            className="flex-1 bg-slate-100 border-none rounded-xl"
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              (!input.trim() && selectedFiles.length === 0) ||
              !selectedUser ||
              isUploading
            }
            className="bg-blue-600 text-white rounded-xl px-5"
          >
            {isUploading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div
        className={`h-full bg-white border-l transition-all duration-500 ease-in-out ${isInfoOpen ? "w-[350px] opacity-100" : "w-0 opacity-0 overflow-hidden"}`}
      >
        <div className="w-[350px] p-8">
          <h2 className="text-xl font-black text-slate-800 mb-8 border-b pb-4 uppercase italic">
            Personnel Profile
          </h2>
          <div className="space-y-6 text-sm">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Office Location
              </label>
              <p className="font-semibold">{selectedUser?.office || "N/A"}</p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Assigned Unit
              </label>
              <p className="font-semibold">{selectedUser?.unit || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
