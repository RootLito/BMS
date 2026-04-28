import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User"; 
import { writeFile } from "fs/promises";
import { join } from "path";

export async function GET() {
    try {
        await dbConnect();
        const posts = await Post.find()
            .populate("author", "fullname username image office")
            .sort({ createdAt: -1 });
        return NextResponse.json(posts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();

        // 1. Use formData() instead of json() to get the files
        const data = await req.formData();
        const content = data.get("content");
        const files = data.getAll("files"); // This gets all uploaded files

        const uploadedFilesData = [];

        // 2. Process and save each file to your public folder
        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `${Date.now()}-${file.name}`;
            const path = join(process.cwd(), "public", "uploads", fileName);

            await writeFile(path, buffer);

            uploadedFilesData.push({
                url: `/uploads/${fileName}`,
                fileName: file.name,
                fileType: file.type.startsWith("video") ? "video" : "image"
            });
        }

        // 3. Create the post with the locally saved URLs
        const newPost = await Post.create({
            content,
            files: uploadedFilesData,
            author: session.user.id || session.user.sub
        });

        const populatedPost = await Post.findById(newPost._id)
            .populate("author", "fullname username image office");

        return NextResponse.json(populatedPost);
    } catch (error) {
        console.error("POST_ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}