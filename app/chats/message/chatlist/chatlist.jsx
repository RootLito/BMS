"use client";
import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Plus, Users, User } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ChatList({
  users,
  onlineUsers,
  notifications,
  selectedUser,
  onSelectUser,
  currentUserId,
  testSound,
}) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [appliedOffice, setAppliedOffice] = useState("all");
  const [appliedStatus, setAppliedStatus] = useState("all");

  // Group Creation States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [groups, setGroups] = useState([]);

  // FETCH GROUPS FROM API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups");
        const data = await res.json();
        if (res.ok) {
          // Map groups to ensure they have an internal flag or clear member structure
          setGroups(data);
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
      }
    };
    fetchGroups();
  }, [isModalOpen]);

  // Original Filtering Logic
  const offices = useMemo(() => {
    const distinct = [...new Set(users.map((u) => u.office))].filter(Boolean);
    return distinct.sort();
  }, [users]);

  const filteredUsers = users.filter((u) => {
    const isNotMe = String(u._id) !== String(currentUserId);
    const matchesSearch = u.fullname
      ?.toLowerCase()
      .includes(search.toLowerCase());
    const matchesOffice = appliedOffice === "all" || u.office === appliedOffice;
    const isOnline = onlineUsers.includes(String(u._id));
    const matchesStatus =
      appliedStatus === "all" ||
      (appliedStatus === "online" && isOnline) ||
      (appliedStatus === "offline" && !isOnline);

    return isNotMe && matchesSearch && matchesOffice && matchesStatus;
  });

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const modalFilteredUsers = users.filter((u) => {
    const isNotMe = String(u._id) !== String(currentUserId);
    return (
      isNotMe && u.fullname?.toLowerCase().includes(memberSearch.toLowerCase())
    );
  });

  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    if (!currentUserId) {
      toast.error("User session not found. Please re-login.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          members: selectedMembers,
          createdBy: currentUserId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Group Created", {
          description: `"${groupName}" has been launched successfully.`,
          position: "bottom-right",
        });

        setIsModalOpen(false);
        setGroupName("");
        setSelectedMembers([]);
      } else {
        toast.error(data.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Group Creation Error:", error);
      toast.error("Connection Error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-[380px] h-full p-4 border-r flex flex-col bg-slate-50/50">
      {/* Search & Filter Header */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white pl-9 border-slate-200 rounded-xl"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={
                appliedOffice !== "all" || appliedStatus !== "all"
                  ? "default"
                  : "outline"
              }
              size="icon"
              className={`rounded-xl ${appliedOffice !== "all" || appliedStatus !== "all" ? "bg-blue-600" : "bg-white"}`}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Offices
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="max-h-[200px] overflow-y-auto">
              <DropdownMenuCheckboxItem
                checked={appliedOffice === "all"}
                onCheckedChange={() => setAppliedOffice("all")}
              >
                All Offices
              </DropdownMenuCheckboxItem>
              {offices.map((off) => (
                <DropdownMenuCheckboxItem
                  key={off}
                  checked={appliedOffice === off}
                  onCheckedChange={() => setAppliedOffice(off)}
                >
                  {off}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Status
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={appliedStatus === "all"}
              onCheckedChange={() => setAppliedStatus("all")}
            >
              Show All
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={appliedStatus === "online"}
              onCheckedChange={() => setAppliedStatus("online")}
            >
              Online
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={appliedStatus === "offline"}
              onCheckedChange={() => setAppliedStatus("offline")}
            >
              Offline
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <div className="flex flex-col mb-4">
        <div className="flex bg-slate-200/50 p-1 rounded-xl gap-1">
          <Button
            variant="ghost"
            className={`flex-1 flex items-center gap-2 h-9 text-xs font-bold rounded-lg transition-all ${activeTab === "all" ? "bg-white text-blue-600" : "text-slate-500"}`}
            onClick={() => setActiveTab("all")}
          >
            <User className="h-3.5 w-3.5" /> Personnel
          </Button>
          <Button
            variant="ghost"
            className={`flex-1 flex items-center gap-2 h-9 text-xs font-bold rounded-lg transition-all ${activeTab === "group" ? "bg-white text-blue-600" : "text-slate-500"}`}
            onClick={() => setActiveTab("group")}
          >
            <Users className="h-3.5 w-3.5" /> Groups
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {activeTab === "all" ? "All Chats" : "Group Chats"}
          </h3>
          {activeTab === "group" && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsModalOpen(true)}
              className="h-6 w-6 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {activeTab === "all" ? (
          filteredUsers.map((user) => {
            const isOnline = onlineUsers.includes(String(user._id));
            const isActive = selectedUser?._id === user._id;
            const unreadCount = notifications[String(user._id)] || 0;

            return (
              <div
                key={user._id}
                onClick={() => onSelectUser(user)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isActive ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-transparent hover:border-slate-200"}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarFallback
                      className={`${isActive ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-700"} font-bold text-xs`}
                    >
                      {user.fullname?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <span className="text-sm font-bold truncate block">
                    {user.fullname}
                  </span>
                  <p
                    className={`text-[10px] uppercase font-medium truncate ${isActive ? "text-blue-100" : "text-slate-500"}`}
                  >
                    {user.office}
                  </p>
                </div>
                {unreadCount > 0 && !isActive && (
                  <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="space-y-1">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => {
                const isActive = selectedUser?._id === group._id;
                const unreadCount = notifications[String(group._id)] || 0;

                return (
                  <div
                    key={group._id}
                    onClick={() => onSelectUser(group)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isActive ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" : "bg-white border-transparent hover:border-slate-200"}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarFallback
                          className={`${isActive ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-600"} font-bold text-xs`}
                        >
                          {group.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 overflow-hidden text-left">
                      <span className="text-sm font-bold truncate block">
                        {group.name}
                      </span>
                      <p
                        className={`text-[10px] uppercase font-medium truncate ${isActive ? "text-blue-100" : "text-slate-500"}`}
                      >
                        {group.members?.length || 0} Members
                      </p>
                    </div>
                    {unreadCount > 0 && !isActive && (
                      <div className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">
                No group found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal remains exactly the same */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="p-6 bg-white border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div className="space-y-0.5 text-left">
                <DialogTitle className="text-lg font-black tracking-tight text-slate-800 uppercase leading-none">
                  Create Group
                </DialogTitle>
                <DialogDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Establish a new communication channel
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 bg-white">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Group Name
              </label>
              <Input
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-12 border-slate-200 bg-slate-50/50 focus:bg-white rounded-xl font-medium"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Add Members (Optional)
                </label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {selectedMembers.length} Selected
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search personnel..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9 h-10 text-xs bg-slate-50 border-none rounded-xl"
                />
              </div>
              <ScrollArea className="h-[200px] rounded-xl border border-slate-100 bg-white">
                <div className="divide-y divide-slate-50">
                  {modalFilteredUsers.map((user) => {
                    const isSelected = selectedMembers.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        className={`flex items-center gap-3 p-3 transition-all cursor-pointer ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                        onClick={() => toggleMember(user._id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleMember(user._id)}
                          className="data-[state=checked]:bg-blue-600 border-slate-300 rounded"
                        />
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-[10px] bg-slate-100 font-bold text-slate-600">
                            {user.fullname?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-slate-700 truncate leading-none">
                            {user.fullname}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                            {user.office}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 border-t flex flex-row items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 h-11 px-6 rounded-xl"
            >
              Discard
            </Button>
            <Button
              disabled={!groupName.trim() || isSaving}
              onClick={handleCreateGroup}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest px-8 h-11 rounded-xl shadow-lg shadow-blue-100 transition-all"
            >
              {isSaving ? "Creating..." : "Launch Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
