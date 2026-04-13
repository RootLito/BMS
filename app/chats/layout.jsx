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
import { User, Settings, LogOut } from "lucide-react";
import Link from "next/link";

export default function Layout({ children }) {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]); 
  const [search, setSearch] = useState("");
  const socket = useRef(null);

  // 1. Fetch ALL users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        
        // Ensure IDs are strings to match NextAuth session ID type
        const sanitized = data.map(u => ({
          ...u,
          _id: String(u._id)
        }));

        setUsers(sanitized);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    
    fetchUsers();
  }, []);

  // 2. Socket connection
  useEffect(() => {
    if (session?.user?.id) {
      socket.current = io("http://localhost:3000", {
        query: { userId: String(session.user.id) },
        transports: ["websocket"],
      });

      socket.current.on("get-online-users", (userIds) => {
        setOnlineUsers(userIds.map(id => String(id)));
      });

      return () => {
        if (socket.current) socket.current.disconnect();
      };
    }
  }, [session?.user?.id]);

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      {/* HEADER SECTION - RESTORED ORIGINAL */}
      <div className="w-full h-[60px] flex items-center justify-between px-4 bg-gray-200 shadow-sm">
        <h1 className="text-4xl font-bold text-blue-900">BMS</h1>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium hidden md:block leading-none">
                  {session?.user?.name || session?.user?.fullname}
                </span>
                <span className="text-[10px] text-green-600 font-bold">ONLINE</span>
              </div>
              <Avatar className="w-[40px] h-[40px] border-2 border-slate-800">
                <AvatarFallback className="bg-slate-800 text-white">
                  {session?.user?.name?.substring(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground uppercase">
                  {session?.user?.unit}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 focus:text-red-600" 
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full flex-1 flex bg-white overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[400px] h-full p-4 border-r flex flex-col">
          <ButtonGroup className="w-full mb-4">
            <Input 
              placeholder="Search personnel..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline">Search</Button>
          </ButtonGroup>

          {/* USER LIST - NO ACCORDION */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {users
                .filter((u) => 
                  String(u._id) !== String(session?.user?.id) && 
                  u.fullname?.toLowerCase().includes(search.toLowerCase())
                )
                .map((user) => {
                  const isOnline = onlineUsers.includes(String(user._id));
                  return (
                    <Link 
                      key={user._id} 
                      href={`/chats/${user._id}`}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                            {user.fullname?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                        )}
                      </div>
                      <div className="flex flex-col text-black overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {user.fullname}
                          </span>
                          {isOnline && (
                            <span className="text-[9px] text-green-600 font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase truncate">
                          {user.unit} | {user.office}
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 h-full bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
}