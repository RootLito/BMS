import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import { auth } from "@/auth"; 

export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params; 
    const currentUserId = session.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId },
      ],
    }).sort({ createdAt: 1 }); 

    return NextResponse.json(messages);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}