"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  MessageCircle,
  Plus,
  Send,
  Loader2,
  Megaphone,
  ImagePlus,
  X,
  Film,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AnnouncementPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeResponses, setActiveResponses] = useState([]);
  const [responseText, setResponseText] = useState("");
  const [loadingResponses, setLoadingResponses] = useState(false);

  // State for Fullscreen View
  const [selectedImage, setSelectedImage] = useState(null);

  const fileInputRef = useRef(null);

  const fetchAnnouncements = useCallback(async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) {
      const data = await res.json();
      setAnnouncements(data);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAcknowledge = async (id) => {
    const userId = session?.user?.id;
    if (!userId) return;

    setAnnouncements((prev) =>
      prev.map((ann) => {
        if (ann._id === id) {
          const alreadyAcked = ann.acknowledgments?.some(
            (a) => (a.user?._id || a.user) === userId,
          );
          if (alreadyAcked) return ann;
          return {
            ...ann,
            acknowledgments: [...(ann.acknowledgments || []), { user: userId }],
          };
        }
        return ann;
      }),
    );

    await fetch(`/api/announcements/${id}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  };

  const loadResponses = async (id) => {
    setLoadingResponses(true);
    const res = await fetch(`/api/announcements/${id}/responses`);
    if (res.ok) {
      const data = await res.json();
      setActiveResponses(data);
    }
    setLoadingResponses(false);
  };

  const handlePostResponse = async (id) => {
    if (!responseText.trim() || !session?.user?.id) return;
    const res = await fetch(`/api/announcements/${id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorId: session.user.id,
        content: responseText,
      }),
    });
    if (res.ok) {
      const newRes = await res.json();
      setActiveResponses((prev) => [...prev, newRes]);
      setResponseText("");
      fetchAnnouncements();
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!content.trim() || !title.trim() || !session?.user?.id) return;
    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("author", session.user.id);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/announcements", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        setFiles([]);
        setOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const formatAnnouncementDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
      if (diffInSeconds < 60) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      return `${diffInHours}h ago`;
    } else {
      const monthDay = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
      }).format(date);
      const timePart = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      return `${monthDay} at ${timePart}`;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="w-[700px] mx-auto flex flex-col gap-4 p-4">
        {/* CREATE CARD */}
        <Card>
          <CardContent className="flex items-center justify-between ">
            <div className="flex gap-3 items-center">
              <Megaphone className="text-primary w-8 h-8" />
              <div className="text-left flex flex-col justify-center">
                <p className="font-bold text-base leading-tight text-black">
                  Announcements
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Stay updated with the latest news and notices
                </p>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Create
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-4 border-b text-center relative">
                  <DialogTitle className="text-xl font-bold w-full">
                    New Announcement
                  </DialogTitle>
                </DialogHeader>
                <div className="p-4 flex flex-col gap-4">
                  <Input
                    placeholder="Announcement Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="font-bold"
                  />
                  <Textarea
                    placeholder="What's the update?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />

                  {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[150px]">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="relative aspect-square border rounded-md overflow-hidden bg-muted flex items-center justify-center"
                        >
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file)}
                              className="object-cover w-full h-full"
                              alt="preview"
                            />
                          ) : (
                            <Film className="h-6 w-6 text-muted-foreground" />
                          )}
                          <button
                            onClick={() => removeFile(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border rounded-lg p-2 bg-muted/20">
                    <span className="text-sm font-medium ml-2 text-muted-foreground">
                      Add to announcement
                    </span>
                    <div className="flex gap-1">
                      <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Button
                    disabled={isPublishing || !content.trim() || !title.trim()}
                    onClick={handleCreateAnnouncement}
                    className="w-full"
                  >
                    {isPublishing && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Publish Announcement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* ANNOUNCEMENT LIST */}
        <div className="space-y-4">
          {announcements.map((item) => {
            const hasAcked = item.acknowledgments?.some(
              (a) => (a.user?._id || a.user) === session?.user?.id,
            );
            return (
              <Card
                key={item._id}
                className="overflow-hidden border-l-4 border-l-primary"
              >
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <Avatar>
                    <AvatarImage
                      src={item.author?.image}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {item.author?.fullname?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <CardTitle className="text-sm font-bold text-black">
                      {item.author?.fullname}
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      {formatAnnouncementDate(item.createdAt)}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-left whitespace-pre-wrap p-0">
                  <div className="px-6 pb-2">
                    <p className="font-bold mb-1 text-base text-black">
                      {item.title}
                    </p>
                    <p className="text-muted-foreground">{item.content}</p>
                  </div>

                  {/* DISPLAY IMAGES AFTER CONTENT */}
                  {item.files && item.files.length > 0 && (
                    <div
                      className={`grid gap-0.5 mt-2 ${item.files.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                    >
                      {item.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video bg-muted cursor-pointer hover:opacity-95 transition"
                          onClick={() => setSelectedImage(file.url)}
                        >
                          <img
                            src={file.url}
                            className="w-full h-full object-cover"
                            alt="attachment"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-muted/30 py-2 flex gap-6">
                  <button
                    disabled={hasAcked}
                    onClick={() => handleAcknowledge(item._id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                      hasAcked
                        ? "text-green-600 cursor-default"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${hasAcked ? "fill-green-50" : ""}`}
                    />
                    {hasAcked ? "Acknowledged" : "Acknowledge"}
                    <span className="ml-1 opacity-70">
                      {item.acknowledgments?.length || 0}
                    </span>
                  </button>

                  <Dialog
                    onOpenChange={(isOpen) => isOpen && loadResponses(item._id)}
                  >
                    <DialogTrigger asChild>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        Respond
                        <span className="ml-1 opacity-70">
                          {item.responses?.length || 0}
                        </span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="flex flex-col h-[80vh] max-h-[600px] p-0 gap-0">
                      <DialogHeader className="p-4 border-b">
                        <DialogTitle>Responses</DialogTitle>
                      </DialogHeader>
                      <div className="flex-1 overflow-y-auto space-y-4 p-4">
                        {loadingResponses ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-muted-foreground" />
                          </div>
                        ) : activeResponses.length === 0 ? (
                          <p className="text-center text-muted-foreground text-sm py-10">
                            No responses yet.
                          </p>
                        ) : (
                          activeResponses.map((r) => (
                            <div key={r._id} className="flex gap-2 text-left">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={r.author?.image} />
                                <AvatarFallback>
                                  {r.author?.fullname?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-muted p-2.5 rounded-2xl rounded-tl-none">
                                <p className="font-bold text-[11px] leading-none mb-1 text-black">
                                  {r.author?.fullname}
                                </p>
                                <p className="text-sm">{r.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-4 border-t bg-background">
                        <div className="flex gap-2">
                          <input
                            className="flex-1 text-sm bg-muted rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Write a response..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handlePostResponse(item._id);
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            className="rounded-full shrink-0"
                            disabled={!responseText.trim()}
                            onClick={() => handlePostResponse(item._id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN IMAGE MODAL */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            className="max-w-full max-h-full object-contain"
            alt="Fullscreen"
          />
        </div>
      )}
    </div>
  );
}
