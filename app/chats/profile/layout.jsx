"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { File, User, Pencil, Upload, X } from "lucide-react";

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

export default function ProfileLayout({ children }) {
  const { data: session } = useSession();

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImage(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      <div className="w-[700px] mx-auto flex flex-col gap-4 p-4">
        <Card className="relative overflow-hidden border-none shadow-md">
          <div className="absolute top-4 right-4 z-10">
            <Dialog onOpenChange={(open) => !open && setImage(null)}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
                  <Pencil className="h-3.5 w-3.5" /> Edit Profile
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 border-b bg-gray-50/80 text-left">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Update Profile Picture
                  </DialogTitle>
                  {/* INSTRUCTIONS ARE BACK */}
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    Click to select an image. Once uploaded,{" "}
                    <strong>drag the photo</strong> to reposition and{" "}
                    <strong>scroll</strong> to zoom. No fixed aspect ratio—crop
                    it how you like.
                  </DialogDescription>
                </DialogHeader>

                {/* CROP AREA - FULL BLEED (EDGE TO EDGE) */}
                <div className="relative h-[450px] w-full bg-neutral-900">
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
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
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
                    disabled={!image}
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-sm"
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <CardContent className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={session?.user?.image || "https://github.com/shadcn.png"}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-slate-100">
                U
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {session?.user?.fullname || session?.user?.name}
              </h2>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest italic">
                {session?.user?.office}
              </p>
            </div>
          </CardContent>

          <CardFooter className="gap-10 border-t justify-center py-5 bg-gray-50/50">
            <Link
              href="/chats/profile/posts"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition text-xs"
            >
              <File size={16} /> Posts
            </Link>
            <Link
              href="/chats/profile/about"
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition text-xs"
            >
              <User size={16} /> About
            </Link>
          </CardFooter>
        </Card>

        <div className="flex-1 mt-4">{children}</div>
      </div>
    </div>
  );
}
