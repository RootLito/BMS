import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { auth } from "@/auth";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Must match folder name [commentId]
        const { commentId } = await params;
        const { type } = await req.json();
        const userId = session.user.id || session.user.sub;

        const comment = await Comment.findById(commentId);
        if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

        if (!comment.reacts) comment.reacts = [];

        const existingIndex = comment.reacts.findIndex(
            (r) => r.user.toString() === userId
        );

        if (existingIndex > -1) {
            if (comment.reacts[existingIndex].type === type) {
                comment.reacts.splice(existingIndex, 1);
            } else {
                comment.reacts[existingIndex].type = type;
            }
        } else {
            comment.reacts.push({ user: userId, type });
        }

        await comment.save();

        const updatedComment = await Comment.findById(commentId).populate("reacts.user", "fullname image");
        return NextResponse.json(updatedComment);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}