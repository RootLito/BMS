import dbConnect from "@/lib/mongodb";
import ResponseModel from "@/models/Response";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
    const { id } = await params;
    await dbConnect();
    const responses = await ResponseModel.find({ announcement: id })
        .populate("author", "fullname image profile")
        .sort({ createdAt: 1 });
    return NextResponse.json(responses);
}

export async function POST(req, { params }) {
    try {
        await dbConnect(); 
        const { id } = await params;
        const { authorId, content } = await req.json();

        const response = await ResponseModel.create({
            announcement: id,
            author: authorId,
            content
        });

        const populated = await response.populate("author", "fullname image profile");
        return NextResponse.json(populated);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}