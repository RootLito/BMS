import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import { auth } from "@/auth"; // Import the auth function directly

export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    // In Auth.js v5, we just call auth() to get the session
    const session = await auth();
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params for Next.js 15+
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