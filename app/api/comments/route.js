import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Comment from "@/models/Comment";

export async function GET(req) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    const comments = await Comment.find({ post: postId })
        .populate("author", "fullname image profile")
        .populate("reacts.user", "fullname image") // <--- ADD THIS
        .sort({ createdAt: -1 });

    return NextResponse.json(comments);
}

export async function POST(req) {
    await dbConnect();
    try {
        const body = await req.json();
        const comment = await Comment.create(body);
        // Populate both author and reacts (though reacts will be empty on creation)
        const populatedComment = await comment.populate([
            { path: "author", select: "fullname image profile" },
            { path: "reacts.user", select: "fullname image" }
        ]);
        return NextResponse.json(populatedComment);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}