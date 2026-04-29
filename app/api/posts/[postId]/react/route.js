import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import { auth } from "@/auth";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must match folder name [postId]
        const { postId } = await params;
        const { type } = await req.json();
        const userId = session.user.id || session.user.sub;

        const post = await Post.findById(postId);
        if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

        if (!post.reacts) post.reacts = [];

        const existingIndex = post.reacts.findIndex(
            (r) => r.user.toString() === userId
        );

        if (existingIndex > -1) {
            if (post.reacts[existingIndex].type === type) {
                // Remove if clicking same emoji
                post.reacts.splice(existingIndex, 1);
            } else {
                // Update if clicking different emoji
                post.reacts[existingIndex].type = type;
            }
        } else {
            // Add new
            post.reacts.push({ user: userId, type });
        }

        await post.save();

        const updatedPost = await Post.findById(postId).populate("reacts.user", "fullname image");
        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error("REACTION_ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}