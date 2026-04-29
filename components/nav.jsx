"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added AvatarImage
import {
  User,
  Settings,
  LogOut,
  House,
  Megaphone,
  MessageCircleMore,
  Fish,
} from "lucide-react";

export default function Nav() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="w-full h-[60px] flex items-center justify-between px-6 bg-white border-b border-gray-200 sticky top-0 z-50">
      <h1 className="text-2xl font-black text-blue-600 flex items-center">
        <Fish strokeWidth={3} className="mr-2" /> FISHBOOK
      </h1>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push("/chats/home")}>
          <House className="mr-2 h-4 w-4" /> Home
        </Button>
        <Button variant="outline" onClick={() => router.push("/chats/message")}>
          <MessageCircleMore className="mr-2 h-4 w-4" /> Chats
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/chats/announcement")}
        >
          <Megaphone className="mr-2 h-4 w-4" /> Announcement
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold hidden md:block leading-none">
                {session?.user?.fullname || session?.user?.name || "User"}
              </span>
              <span className="text-[10px] text-green-600 font-black uppercase">
                Online
              </span>
            </div>
            <Avatar className="w-[38px] h-[38px]">
              <AvatarImage
                src={session?.user?.profile}
                className="object-cover"
              />
              <AvatarFallback className="bg-slate-800 text-white text-xs">
                {session?.user?.fullname?.[0] ||
                  session?.user?.name?.[0] ||
                  "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/chats/profile")}>
            <User className="mr-2 h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/chats/setting")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
