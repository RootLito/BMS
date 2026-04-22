import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import Group from "@/models/Group";
import { auth } from "@/auth";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await auth();

    if (!session || (!session.user?.id && !session.user?._id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetId } = await params;
    const currentUserId = session.user.id || session.user._id;

    const isGroup = await Group.exists({ _id: targetId });

    let messages;

    if (isGroup) {
      messages = await Message.find({ groupId: targetId })
        .populate("sender", "fullname office")
        .sort({ createdAt: 1 });
    } else {
      messages = await Message.find({
        $or: [
          { sender: currentUserId, receiver: targetId },
          { sender: targetId, receiver: currentUserId },
        ],
      })
        .sort({ createdAt: 1 });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}