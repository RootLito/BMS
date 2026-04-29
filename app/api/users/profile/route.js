import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const data = await req.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const uploadDir = join(process.cwd(), "public", "profiles");

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }

    const path = join(uploadDir, fileName);
    await writeFile(path, buffer);

    const imageUrl = `/profiles/${fileName}`;

    // Update User model
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id || session.user.sub,
      { profile: imageUrl },
      { new: true }
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PROFILE_UPDATE_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}