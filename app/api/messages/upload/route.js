import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = Date.now() + "_" + file.name.replaceAll(" ", "_");
  
  // 1. Determine Folder based on MIME Type
  let folder = "attachments";
  let type = "document";

  if (file.type.startsWith("image/")) {
    folder = "images";
    type = "image";
  } else if (file.type.startsWith("video/")) {
    folder = "videos";
    type = "video";
  }

  const relativePath = `/uploads/${folder}/${filename}`;
  const fullPath = path.join(process.cwd(), "public", "uploads", folder);

  try {
    // 2. Ensure directory exists
    await mkdir(fullPath, { recursive: true });
    
    // 3. Write file
    await writeFile(path.join(fullPath, filename), buffer);

    return NextResponse.json({ 
      url: relativePath, 
      fileName: file.name,
      type: type 
    });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}