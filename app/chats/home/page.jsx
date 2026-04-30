"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import EmojiPicker from "emoji-picker-react";
import {
  ThumbsUp,
  MessageCircle,
  Plus,
  Send,
  Smile,
  ImagePlus,
  UserPlus,
  MapPin,
  MoreHorizontal,
  Loader2,
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
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds >= 86400) {
    return date
      .toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .replace(",", " at");
  }

  if (diffInSeconds < 60) return "Just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}

const CommentItem = ({ comment, allComments, onReply, onReact, session }) => {
  const replies = allComments.filter((c) => c.parentComment === comment._id);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");

  const userReacted = comment.reacts?.find(
    (r) => (r.user?._id || r.user) === session?.user?.id,
  );

  return (
    <div className="flex gap-2 mt-4">
      <Avatar size="sm" className="h-8 w-8">
        <AvatarImage src={comment.author?.image} />
        <AvatarFallback>{comment.author?.fullname?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-left">
        <div className="relative bg-gray-100 rounded-2xl px-3 py-2 inline-block max-w-full">
          <p className="text-xs font-bold">{comment.author?.fullname}</p>
          <p className="text-sm">{comment.content}</p>
          {comment.reacts?.length > 0 && (
            <div className="absolute -bottom-2 -right-2 bg-white shadow-sm border rounded-full px-1 flex items-center text-[10px]">
              <span>{comment.reacts[0].type}</span>
              {comment.reacts.length > 1 && (
                <span className="ml-0.5 font-bold">
                  {comment.reacts.length}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 text-[11px] font-bold text-gray-500 mt-1 ml-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`hover:underline flex items-center gap-1.5 ${userReacted ? "text-blue-600" : ""}`}
              >
                {userReacted ? (
                  <span className="text-[14px] leading-none">
                    {userReacted.type}
                  </span>
                ) : (
                  <ThumbsUp size={14} />
                )}
                <span>{userReacted ? "Reacted" : "React"}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              className="p-0 border-none shadow-xl z-[100]"
            >
              <EmojiPicker
                onEmojiClick={(e) => onReact(comment._id, e.emoji)}
                allowExpandReactions={true}
              />
            </PopoverContent>
          </Popover>
          <button
            className="hover:underline"
            onClick={() => setShowReplyInput(!showReplyInput)}
          >
            Reply
          </button>
          <span>{formatTimeAgo(comment.createdAt)}</span>
        </div>
        {showReplyInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              className="flex-1 bg-gray-100 rounded-full px-3 py-1 text-sm outline-none border"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onReply(replyText, comment._id);
                  setReplyText("");
                  setShowReplyInput(false);
                }
              }}
            />
          </div>
        )}
        {replies.map((reply) => (
          <CommentItem
            key={reply._id}
            comment={reply}
            allComments={allComments}
            onReply={onReply}
            onReact={onReact}
            session={session}
          />
        ))}
      </div>
    </div>
  );
};

export default function HomePage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activePostComments, setActivePostComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const fileInputRef = useRef(null);

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    if (Array.isArray(data)) setPosts(data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!content.trim() && files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      files.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]);
        setContent("");
        setFiles([]);
        setOpen(false);
      }
    } catch (error) {
      console.error("POST_ERROR:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostReaction = async (postId, type) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id === postId) {
          const reacts = p.reacts || [];
          const existingIdx = reacts.findIndex(
            (r) => (r.user?._id || r.user) === session?.user?.id,
          );

          let newReacts;
          if (existingIdx > -1) {
            if (reacts[existingIdx].type === type) {
              newReacts = reacts.filter((_, i) => i !== existingIdx);
            } else {
              newReacts = [...reacts];
              newReacts[existingIdx] = { ...newReacts[existingIdx], type };
            }
          } else {
            newReacts = [
              ...reacts,
              {
                user: {
                  _id: session?.user?.id,
                  fullname: session?.user?.fullname,
                  image: session?.user?.image,
                },
                type,
              },
            ];
          }
          return { ...p, reacts: newReacts };
        }
        return p;
      }),
    );

    await fetch(`/api/posts/${postId}/react`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
  };

  const handleCommentReaction = async (commentId, type) => {
    setActivePostComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          const reacts = c.reacts || [];
          const existingIdx = reacts.findIndex(
            (r) => (r.user?._id || r.user) === session?.user?.id,
          );

          let newReacts;
          if (existingIdx > -1) {
            if (reacts[existingIdx].type === type) {
              newReacts = reacts.filter((_, i) => i !== existingIdx);
            } else {
              newReacts = [...reacts];
              newReacts[existingIdx] = { ...newReacts[existingIdx], type };
            }
          } else {
            newReacts = [
              ...reacts,
              {
                user: {
                  _id: session?.user?.id,
                  fullname: session?.user?.fullname,
                  image: session?.user?.image,
                },
                type,
              },
            ];
          }
          return { ...c, reacts: newReacts };
        }
        return c;
      }),
    );

    await fetch(`/api/comments/${commentId}/react`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
  };

  const handlePostComment = async (
    postId,
    parentId = null,
    textOverride = null,
  ) => {
    const text = textOverride || commentText;
    if (!text.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        post: postId,
        author: session?.user?.id,
        content: text,
        parentComment: parentId,
      }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setActivePostComments((prev) => [newComment, ...prev]);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, commentsCount: (p.commentsCount || 0) + 1 }
            : p,
        ),
      );
      if (!parentId) setCommentText("");
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="w-[700px] mx-auto flex flex-col gap-4 p-4">
        <Card>
          <CardContent className="flex items-center justify-between ">
            <div className="flex gap-2 items-center">
              <Avatar size="lg">
                <AvatarImage src={session?.user?.profile} />
              </Avatar>
              <div className="text-left">
                <p className="font-bold text-sm">{session?.user?.fullname}</p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.office} - {session?.user?.unit}
                </p>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="text-xs font-bold">
                  <Plus className="mr-1 h-4 w-4" /> New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-4 border-b text-center relative">
                  <DialogTitle className="text-xl font-bold w-full">
                    Create Post
                  </DialogTitle>
                </DialogHeader>

                <div className="p-4 flex flex-col gap-4">
                  <div className="flex gap-3 items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session?.user?.profile} />
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-semibold text-sm leading-tight text-left">
                        {session?.user?.name || "User Name"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session?.user?.unit}
                      </p>
                    </div>
                  </div>

                  <Textarea
                    placeholder={`What's on your mind, ${session?.user?.name?.split(" ")[0] || "User"}?`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[150px] border-none focus-visible:ring-0 text-xl md:text-2xl shadow-none p-0 resize-none placeholder:text-gray-500"
                  />

                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[12px] bg-blue-50 p-2 rounded-md border border-blue-100">
                      <p className="w-full font-bold text-blue-600 mb-1">
                        Attached files:
                      </p>
                      {files.map((f, i) => (
                        <span
                          key={i}
                          className="bg-white px-2 py-1 rounded shadow-sm border"
                        >
                          {f.name}
                        </span>
                      ))}
                      <button
                        onClick={() => setFiles([])}
                        className="text-red-500 hover:underline ml-auto font-bold"
                      >
                        Clear All
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between border rounded-lg p-2">
                    <span className="text-sm font-semibold px-2">
                      Add to your post
                    </span>
                    <div className="flex gap-1">
                      <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={(e) =>
                          setFiles(Array.from(e.target.files || []))
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-500 hover:bg-gray-100 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-8 w-8" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <Button
                    disabled={
                      isUploading || (!content.trim() && files.length === 0)
                    }
                    className={`w-full font-bold h-10 ${
                      content.trim() || files.length > 0
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={handleCreatePost}
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {posts.map((post) => {
            const userReacted = post.reacts?.find(
              (r) => (r.user?._id || r.user) === session?.user?.id,
            );

            return (
              <Card key={post._id} className="overflow-hidden">
                <CardHeader className="pb-2 text-left">
                  <div className="flex items-center gap-2">
                    <Avatar size="lg">
                      <AvatarImage
                        src={post.author?.profile}
                        className="object-cover"
                      />

                      <AvatarFallback className="bg-slate-800 text-white text-xs">
                        {post.author?.fullname?.[0] ||
                          post.author?.name?.[0] ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <CardTitle className="text-sm font-bold">
                        {post.author?.fullname}
                      </CardTitle>
                      <CardDescription className="text-[10px]">
                        {formatTimeAgo(post.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-left whitespace-pre-wrap">
                    {post.content}
                  </p>
                  {post.files?.length > 0 && (
                    <div className="mt-3 grid gap-2 grid-cols-1">
                      {post.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg overflow-hidden border"
                        >
                          {file.fileType === "image" ? (
                            <img
                              src={file.url}
                              alt={file.fileName}
                              className="w-full h-auto object-cover max-h-[400px]"
                            />
                          ) : (
                            <video src={file.url} controls className="w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t py-3">
                  <div className="flex gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                          {userReacted ? (
                            <span className="text-[18px] leading-none">
                              {userReacted.type}
                            </span>
                          ) : (
                            <ThumbsUp size={18} />
                          )}
                          <span
                            className={`text-xs font-bold ${userReacted ? "text-blue-600" : ""}`}
                          >
                            {userReacted ? "Reacted" : "React"}
                            {post.reacts?.length > 0 && (
                              <span className="ms-2">{post.reacts.length}</span>
                            )}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        side="top"
                        align="start"
                        className="p-0 border-none shadow-xl z-[100]"
                      >
                        <EmojiPicker
                          onEmojiClick={(e) =>
                            handlePostReaction(post._id, e.emoji)
                          }
                          allowExpandReactions={true}
                        />
                      </PopoverContent>
                    </Popover>

                    <Dialog
                      onOpenChange={async (isOpen) => {
                        if (isOpen) {
                          const res = await fetch(
                            `/api/comments?postId=${post._id}`,
                          );
                          const d = await res.json();
                          setActivePostComments(d);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                          <MessageCircle size={18} />
                          <span className="text-xs font-bold">
                            Comment{" "}
                            <span className="ms-2">
                              {post.commentsCount || ""}
                            </span>
                          </span>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[700px] w-[700px] h-[85vh] flex flex-col p-0 overflow-hidden text-left">
                        <DialogHeader className="p-4 border-b shrink-0">
                          <DialogTitle className="text-center font-bold">
                            Post by {post.author?.fullname}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar size="lg">
                                <AvatarImage src={post.author?.image} />
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-bold">
                                  {post.author?.fullname}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {formatTimeAgo(post.createdAt)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap pl-1">
                              {post.content}
                            </p>
                          </div>
                          <div className="space-y-2 border-t pt-4">
                            <p className="text-xs font-bold text-gray-500 uppercase">
                              Comments
                            </p>
                            {activePostComments
                              .filter((c) => !c.parentComment)
                              .map((comment) => (
                                <CommentItem
                                  key={comment._id}
                                  comment={comment}
                                  allComments={activePostComments}
                                  session={session}
                                  onReply={(t, pId) =>
                                    handlePostComment(post._id, pId, t)
                                  }
                                  onReact={handleCommentReaction}
                                />
                              ))}
                          </div>
                        </div>
                        <div className="p-4 border-t bg-white shrink-0">
                          <div className="flex items-center gap-2">
                            <Avatar size="sm" className="h-8 w-8">
                              <AvatarImage src={session?.user?.image} />
                            </Avatar>
                            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1 border focus-within:border-blue-400">
                              <input
                                className="bg-transparent flex-1 text-sm outline-none py-1.5"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handlePostComment(post._id)
                                }
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Smile
                                    size={20}
                                    className="text-gray-500 cursor-pointer mx-1 hover:text-yellow-500"
                                  />
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-full p-0 border-none shadow-xl mb-4"
                                  align="end"
                                >
                                  <EmojiPicker
                                    onEmojiClick={(e) =>
                                      setCommentText((prev) => prev + e.emoji)
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                              <button
                                onClick={() => handlePostComment(post._id)}
                              >
                                <Send
                                  size={18}
                                  className="text-blue-600 ml-1"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex items-center cursor-pointer">
                        <AvatarGroup size="sm">
                          {post.reacts?.slice(0, 3).map((r, i) => (
                            <Avatar key={i} className="border-2 border-white">
                              <AvatarImage src={r.user?.image} />
                              <AvatarFallback>
                                {r.user?.fullname?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {post.reacts?.length > 0 && (
                            <AvatarGroupCount className="text-[10px] font-bold">
                              +{post.reacts.length}
                            </AvatarGroupCount>
                          )}
                        </AvatarGroup>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader className="border-b pb-4">
                        <DialogTitle className="text-center font-bold">
                          Reactions
                        </DialogTitle>
                      </DialogHeader>
                      <div className="max-h-[350px] overflow-y-auto">
                        {post.reacts?.map((r, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-3 px-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={r.user?.image} />
                                <AvatarFallback>
                                  {r.user?.fullname?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-bold">
                                {r.user?.fullname}
                              </span>
                            </div>
                            <span className="text-2xl">{r.type}</span>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
