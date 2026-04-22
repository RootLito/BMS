"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  EllipsisVertical,
  Image as ImageIcon,
  Paperclip,
  Send,
  MessageSquare,
  FileText,
  X,
  Loader2,
  Users as UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/context/ChatContext";
import { useSocket } from "@/context/SocketContext";

import ChatList from "./chatlist/chatlist";

export default function MessagesPage() {
  const { data: session } = useSession();
  const { selectedUser, setSelectedUser } = useChat();
  const { socket, onlineUsers } = useSocket();

  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState({});
  const notificationSound = useRef(null);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef(null);
  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Logic to determine if the selected chat is a group
  const isGroup = !!selectedUser?.members;

  // Fetch Personnel Users
  useEffect(() => {
    notificationSound.current = new Audio("/effects/wow.mp3");
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        const initialNotifications = {};
        const sanitized = data.map((u) => {
          const id = String(u._id);
          if (u.unreadCount > 0) initialNotifications[id] = u.unreadCount;
          return {
            ...u,
            _id: id,
            lastInteraction: u.lastInteraction
              ? new Date(u.lastInteraction).getTime()
              : 0,
          };
        });
        setNotifications(initialNotifications);
        setUsers(
          sanitized.sort((a, b) => b.lastInteraction - a.lastInteraction),
        );
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, [session]);

  // Fetch Message History (Now handles Group or User IDs via your updated route)
  useEffect(() => {
    if (!selectedUser?._id) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/messages/${selectedUser._id}`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    setSelectedFiles([]);
  }, [selectedUser?._id]);

  // Socket Listener
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      const currentUserId = String(session?.user?.id || session?.user?._id);
      const isMe = String(msg.sender?._id || msg.sender) === currentUserId;

      const msgGroupId = msg.groupId ? String(msg.groupId) : null;
      const msgSenderId = String(msg.sender?._id || msg.sender);
      const msgReceiverId = msg.receiverId
        ? String(msg.receiverId)
        : String(msg.receiver || "");

      let belongsToCurrentChat = false;

      if (isGroup) {
        belongsToCurrentChat = msgGroupId === String(selectedUser?._id);
      } else {
        belongsToCurrentChat =
          !msgGroupId &&
          (msgSenderId === String(selectedUser?._id) ||
            msgReceiverId === String(selectedUser?._id));
      }

      if (!isMe && notificationSound.current) {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play().catch(() => {});
      }

      if (!isMe && !belongsToCurrentChat) {
        const notifyKey = msgGroupId || msgSenderId;
        setNotifications((prev) => ({
          ...prev,
          [notifyKey]: (prev[notifyKey] || 0) + 1,
        }));
      }

      if (belongsToCurrentChat || isMe) {
        setMessages((prev) => {
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [
            ...prev.filter((m) => !String(m._id).startsWith("temp-")),
            msg,
          ];
        });
      }
    };

    socket.on("receive-message", handleReceive);
    return () => socket.off("receive-message", handleReceive);
  }, [socket, selectedUser, session, isGroup]);

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
    const senderId = session.user.id || session.user._id;

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
      senderId: senderId,
      content: currentInput,
      files: uploadedFilesData,
      ...(isGroup
        ? { groupId: selectedUser._id }
        : { receiverId: selectedUser._id }),
    };

    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        sender: senderId,
        createdAt: new Date(),
        _id: `temp-${Date.now()}`,
      },
    ]);

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
      fileType: file.type.startsWith("image")
        ? "image"
        : file.type.startsWith("video")
          ? "video"
          : "file",
    }));
    setSelectedFiles((prev) => [...prev, ...filesWithPreview]);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setNotifications((prev) => ({ ...prev, [String(user._id)]: 0 }));
  };

  const testSound = () => {
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full flex-1 flex bg-white overflow-hidden">
      <ChatList
        users={users}
        onlineUsers={onlineUsers}
        notifications={notifications}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        currentUserId={session?.user?.id || session?.user?._id}
        testSound={testSound}
      />

      <div className="flex-1 h-full flex bg-slate-50 overflow-hidden relative">
        <div className="flex flex-col flex-1 relative">
          <div className="w-full flex items-center justify-between bg-white border-b p-4 px-6">
            <div className="flex flex-col text-left">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {selectedUser ? (
                  <>
                    {isGroup && <UsersIcon className="h-5 w-5 text-blue-600" />}
                    {selectedUser.name || selectedUser.fullname}
                  </>
                ) : (
                  "Select Personnel"
                )}
              </h1>
              {selectedUser && (
                <div className="flex items-center gap-1.5">
                  {isGroup ? (
                    <span className="text-xs text-slate-400 font-medium">
                      {selectedUser.members?.length || 0} Members
                    </span>
                  ) : onlineUsers.includes(String(selectedUser._id)) ? (
                    <span className="text-xs text-green-500 font-medium">
                      Active Now
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Offline
                    </span>
                  )}
                </div>
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
              <div className="text-center py-10 flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-slate-400 text-xs italic">
                  Select a personnel to start a conversation
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                // Determine sender ID (handling populated object or string)
                const senderId =
                  typeof msg.sender === "object"
                    ? String(msg.sender._id)
                    : String(msg.sender);
                const isMe =
                  senderId === String(session?.user?.id || session?.user?._id);

                // Show sender name in groups
                const senderDisplayName =
                  typeof msg.sender === "object"
                    ? msg.sender.fullname
                    : "Member";

                return (
                  <div
                    key={msg._id || idx}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      {!isMe && isGroup && (
                        <span className="text-[10px] font-black uppercase text-blue-600 ml-1">
                          {senderDisplayName}
                        </span>
                      )}
                      <div
                        className={`p-3 rounded-2xl shadow-sm ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"}`}
                      >
                        {msg.files?.map((f, i) => (
                          <div
                            key={i}
                            className="mb-2 rounded-lg overflow-hidden border bg-black/5"
                          >
                            {f.fileType === "image" ? (
                              <img
                                src={f.url}
                                alt="attachment"
                                className="w-full max-h-60 object-cover"
                              />
                            ) : (
                              <div className="p-2 text-xs flex items-center gap-2">
                                <FileText size={14} /> {f.fileName}
                              </div>
                            )}
                          </div>
                        ))}
                        {msg.content && (
                          <p className="text-sm leading-relaxed">
                            {msg.content}
                          </p>
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
              <div className="flex gap-3 overflow-x-auto">
                {selectedFiles.map((item, i) => (
                  <div
                    key={i}
                    className="relative min-w-[100px] h-[100px] border rounded-xl overflow-hidden"
                  >
                    {item.preview ? (
                      <img
                        src={item.preview}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="m-auto mt-8 text-blue-500" />
                    )}
                    <button
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute top-1 right-1 bg-white rounded-full p-1"
                    >
                      <X size={12} />
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
              accept=".pdf,.doc,.docx"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => imageInputRef.current?.click()}
              disabled={!selectedUser || isUploading}
            >
              <ImageIcon className="text-blue-500 w-5 h-5" />
            </Button>
            <Button
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
          className={`h-full bg-white border-l transition-all duration-500 ${isInfoOpen ? "w-[350px]" : "w-0 overflow-hidden"}`}
        >
          <div className="w-[350px] p-8">
            <h2 className="text-xl font-black text-slate-800 mb-8 border-b pb-4 uppercase italic">
              {isGroup ? "Group Info" : "Personnel Profile"}
            </h2>
            <div className="space-y-6 text-left">
              {isGroup ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Group Name
                    </label>
                    <p className="font-semibold text-slate-700">
                      {selectedUser.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Members
                    </label>
                    <div className="mt-2 space-y-1">
                      {selectedUser.members?.map((m, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border"
                        >
                          {m.fullname || "User"}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Office
                    </label>
                    <p className="font-semibold text-slate-700">
                      {selectedUser?.office || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Unit
                    </label>
                    <p className="font-semibold text-slate-700">
                      {selectedUser?.unit || "N/A"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
