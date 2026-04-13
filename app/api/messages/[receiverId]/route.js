import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId } = await params;
    const senderId = session.user.id;

    await dbConnect();

    // Fetch messages where either user is sender/receiver
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 }); // Oldest to newest

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}