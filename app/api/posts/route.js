import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET() {
    await dbConnect();

    const posts = await Post.aggregate([
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "post",
                as: "allComments",
            },
        },
        {
            $addFields: {
                commentsCount: { $size: "$allComments" },
            },
        },
        { $sort: { createdAt: -1 } }
    ]);

    const populatedPosts = await Post.populate(posts, [
        { path: "author", select: "fullname profile" },
        { path: "reacts.user", select: "fullname profile" }
    ]);

    return NextResponse.json(populatedPosts);
}

export async function POST(req) {
    try {
        const session = await auth();
        if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await dbConnect();

        const data = await req.formData();
        const content = data.get("content");
        const files = data.getAll("files");

        const uploadedFilesData = [];
        const uploadDir = join(process.cwd(), "public", "uploads");

        await mkdir(uploadDir, { recursive: true });

        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const safeFileName = file.name.replace(/\s+/g, '-').toLowerCase();
            const fileName = `${Date.now()}-${safeFileName}`;
            const path = join(uploadDir, fileName);

            await writeFile(path, buffer);

            uploadedFilesData.push({
                url: `/uploads/${fileName}`,
                fileName: file.name,
                fileType: file.type.startsWith("video") ? "video" : "image"
            });
        }

        const newPost = await Post.create({
            content,
            files: uploadedFilesData,
            author: session.user.id || session.user.sub
        });

        const populatedPost = await Post.findById(newPost._id)
            .populate("author", "fullname username profile office");

        return NextResponse.json(populatedPost);
    } catch (error) {
        console.error("POST_ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}