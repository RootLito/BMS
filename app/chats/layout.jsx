"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { io } from "socket.io-client";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Settings,
  LogOut,
  House,
  Megaphone,
  MessageCircleMore,
} from "lucide-react";
import { ChatProvider, useChat } from "@/context/ChatContext";

export default function Layout({ children }) {
  return (
    <ChatProvider>
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </ChatProvider>
  );
}

function ChatLayoutContent({ children }) {
  const { data: session } = useSession();
  const { selectedUser, setSelectedUser } = useChat();
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState({}); // Notification State
  const [search, setSearch] = useState("");
  const socket = useRef(null);

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        const sanitized = data.map((u) => ({
          ...u,
          _id: String(u._id),
        }));
        setUsers(sanitized);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  // Socket Connection & Notification Listener
  useEffect(() => {
    if (session?.user?.id) {
      // Leave the URL empty or use window.location.origin
      socket.current = io("https://bms.r11.bfar.da.gov.ph", {
        path: "/socket.io",
        query: { userId: String(session.user.id) },
        transports: ["websocket"],
      });

      socket.current.on("get-online-users", (userIds) => {
        setOnlineUsers(userIds.map((id) => String(id)));
      });

      // Global Listener for Notifications
      socket.current.on("receive-message", (msg) => {
        const senderId = String(msg.sender);
        // Only increment if the sender is NOT the currently selected user
        if (senderId !== String(selectedUser?._id)) {
          setNotifications((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
        }
      });

      return () => {
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [session?.user?.id, selectedUser?._id]); // Re-run when selectedUser changes

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    // Clear notification for this user
    setNotifications((prev) => ({
      ...prev,
      [String(user._id)]: 0,
    }));
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100 font-sans text-slate-900">
      {/* HEADER */}
      <div className="w-full h-[60px] flex items-center justify-between px-6 bg-white border-b border-gray-200 z-50">
        <h1 className="text-2xl font-black text-blue-600 tracking-tighter">
          BMS CHAT
        </h1>

        <div className="flex gap-2">
          <Button variant="outline">
            <House className="mr-2 h-4 w-4" /> Home
          </Button>
          <Button variant="outline">
            <MessageCircleMore /> Chats
          </Button>
          <Button variant="outline">
            <Megaphone className="mr-2 h-4 w-4" /> Announcement
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold hidden md:block leading-none">
                  {session?.user?.fullname || session?.user?.name}
                </span>
                <span className="text-[10px] text-green-600 font-black uppercase">
                  Online
                </span>
              </div>
              <Avatar className="w-[38px] h-[38px] border-2 border-blue-600">
                <AvatarFallback className="bg-slate-800 text-white text-xs">
                  {session?.user?.fullname?.substring(0, 2).toUpperCase() ||
                    "US"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Added Profile Item */}
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            {/* Added Settings Item */}
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full flex-1 flex bg-white overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[380px] h-full p-4 border-r flex flex-col bg-slate-50/50">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search personnel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-2">
            {users
              .filter(
                (u) =>
                  String(u._id) !== String(session?.user?.id) &&
                  u.fullname?.toLowerCase().includes(search.toLowerCase()),
              )
              .map((user) => {
                const isOnline = onlineUsers.includes(String(user._id));
                const isActive = selectedUser?._id === user._id;
                const unreadCount = notifications[String(user._id)] || 0;

                return (
                  <div
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer border ${
                      isActive
                        ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-100"
                        : "bg-white border-transparent hover:border-slate-200 hover:bg-white"
                    }`}
                  >
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-white">
                        <AvatarFallback
                          className={`${isActive ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-700"} font-bold`}
                        >
                          {user.fullname?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                    </div>

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-slate-800"}`}
                        >
                          {user.fullname}
                        </span>

                        {unreadCount > 0 && !isActive && (
                          <span className="flex items-center justify-center bg-red-500 text-white text-[10px] font-black h-5 min-w-[20px] px-1.5 rounded-full shadow-sm transition-transform animate-in zoom-in duration-300">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[10px] uppercase font-medium truncate ${isActive ? "text-blue-100" : "text-slate-500"}`}
                      >
                        {user.unit} | {user.office}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 h-full bg-white">{children}</div>
      </div>
    </div>
  );
}
