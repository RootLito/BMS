"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { File, User, Pencil, Upload, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
}

export default function ProfileLayout({ children }) {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImage(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      
      // Using a clean, safe filename for the server
      const file = new window.File([croppedBlob], "profile-picture.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/users/profile", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        await update({
          ...session,
          user: {
            ...session?.user,
            profile: data.profile,
          },
        });
        setOpen(false);
        setImage(null);
        router.refresh();
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="w-[700px] mx-auto flex flex-col gap-4 p-4">
        <Card className="relative overflow-hidden border-none shadow-md">
          <div className="absolute top-4 right-4 z-10">
            <Dialog
              open={open}
              onOpenChange={(val) => {
                setOpen(val);
                if (!val) setImage(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-9 px-3 bg-white/80 backdrop-blur hover:bg-white transition-all shadow-sm"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Update Profile Picture
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    Click to select an image. Once uploaded, drag the photo to reposition and scroll to zoom.
                  </DialogDescription>
                </DialogHeader>

                <div className="relative h-[400px] w-full bg-neutral-900">
                  {!image ? (
                    <div className="relative group flex flex-col items-center justify-center h-full w-full bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onSelectFile}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="h-10 w-10 text-blue-600 mb-2" />
                      <span className="text-sm font-bold text-gray-700">
                        Select Image to Crop
                      </span>
                    </div>
                  ) : (
                    <>
                      <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 z-20 rounded-full shadow-md"
                        onClick={() => setImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                <DialogFooter className="p-6 border-t bg-gray-50/80 justify-end">
                  <Button
                    type="button"
                    disabled={!image || loading}
                    onClick={handleSave}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <CardContent className="flex items-center gap-6 p-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={session?.user?.profile}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-bold bg-slate-100">
                  {session?.user?.fullname?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {session?.user?.fullname || session?.user?.name}
              </h2>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest italic bg-blue-50 w-fit px-2 py-0.5 rounded">
                {session?.user?.office}
              </p>
            </div>
          </CardContent>

          <CardFooter className="gap-10 border-t justify-center py-4 bg-gray-50/50">
            <Link
              href="/chats/profile/posts"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition text-[13px]"
            >
              <File size={18} /> Posts
            </Link>
            <Link
              href="/chats/profile/about"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition text-[13px]"
            >
              <User size={18} /> About
            </Link>
          </CardFooter>
        </Card>

        <div className="flex-1 mt-4">{children}</div>
      </div>
    </div>
  );
}