"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  ThumbsUp,
  MessageCircle,
  Plus,
  Image as ImageIcon,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return "just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default function HomePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    if (Array.isArray(data)) setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newPreviews = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", content);

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData, 
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]); 
        setContent("");
        setSelectedFiles([]);
        setPreviews([]);
        setOpen(false);
      } else {
        const errorData = await res.json();
        console.error("Server Error:", errorData.error);
      }
    } catch (err) {
      console.error("Post failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="w-[700px] mx-auto flex flex-col gap-4 p-4">
        <Card className="flex-shrink-0">
          <CardContent className="flex items-center justify-between">
            <div className="flex gap-2 items-center text-left">
              <Avatar size="lg">
                <AvatarImage
                  src={session?.user?.image || "https://github.com/shadcn.png"}
                />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold">
                  {session?.user?.fullname || session?.user?.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session?.user?.office}
                </span>
              </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button color="primary" className="text-xs font-bold">
                  <Plus className="mr-1 h-4 w-4" /> New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">Create Post</DialogTitle>
                </DialogHeader>

                <Textarea
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-4 min-h-[120px] resize-none border-none focus-visible:ring-0 text-lg shadow-none p-0"
                />

                {/* UPLOAD PREVIEWS */}
                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg overflow-hidden border max-h-[300px] overflow-y-auto">
                    {previews.map((p, i) => (
                      <div
                        key={i}
                        className={`relative aspect-square ${previews.length === 1 ? "col-span-2" : ""}`}
                      >
                        {p.type.startsWith("video") ? (
                          <video
                            src={p.url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={p.url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border rounded-md p-2 mt-4">
                  <span className="text-xs font-bold text-gray-500 px-2">
                    Add to your post
                  </span>
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
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-5 w-5 text-green-500" />
                  </Button>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                    disabled={loading}
                    onClick={handlePostSubmit}
                  >
                    {loading ? "Posting..." : "Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* FEED */}
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <Card key={post._id} className="flex-shrink-0 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Avatar size="lg">
                    <AvatarImage src={post.author?.image} />
                    <AvatarFallback>
                      {post.author?.fullname?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex flex-col text-left">
                    <CardTitle className="text-sm font-bold">
                      {post.author?.fullname}
                    </CardTitle>
                    <CardDescription
                      className="text-[10px]"
                      suppressHydrationWarning
                    >
                      {formatTimeAgo(post.createdAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-left whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* SQUARE GRID FOR FILES */}
                {post.files?.length > 0 && (
                  <div className="w-full overflow-hidden rounded-xl border bg-gray-100">
                    <div className="grid grid-cols-2 gap-1 auto-rows-fr">
                      {post.files.slice(0, 4).map((f, idx) => {
                        const isFull =
                          post.files.length === 1 ||
                          (post.files.length === 3 && idx === 0);
                        return (
                          <div
                            key={idx}
                            className={`relative w-full ${isFull ? "col-span-2" : "col-span-1"}`}
                            style={{
                              height:
                                isFull && post.files.length === 1
                                  ? "auto"
                                  : "250px",
                            }}
                          >
                            {f.fileType === "video" ? (
                              <video
                                src={f.url}
                                className="h-full w-full object-cover"
                                controls
                              />
                            ) : (
                              <img
                                src={f.url}
                                className="h-full w-full object-cover"
                                alt="post content"
                              />
                            )}
                            {idx === 3 && post.files.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-bold">
                                +{post.files.length - 4}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex items-center justify-between border-t py-3">
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                    <ThumbsUp size={18} />
                    <span className="text-xs font-bold">
                      {post.reacts?.length || 0}
                    </span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                    <MessageCircle size={18} />
                    <span className="text-xs font-bold">Comment</span>
                  </button>
                </div>
                <AvatarGroup size="sm">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <AvatarGroupCount>
                    +{post.reacts?.length || 0}
                  </AvatarGroupCount>
                </AvatarGroup>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}