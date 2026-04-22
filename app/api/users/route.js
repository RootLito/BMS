import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";


export async function GET() {
  try {
    await dbConnect();
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);

    const users = await User.aggregate([
      { $match: { _id: { $ne: currentUserId } } },

      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ["$sender", "$$userId"] }, { $eq: ["$receiver", currentUserId] }] },
                    { $and: [{ $eq: ["$sender", currentUserId] }, { $eq: ["$receiver", "$$userId"] }] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: "lastMsg"
        }
      },

      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$sender", "$$userId"] },
                    { $eq: ["$receiver", currentUserId] },
                    { $eq: ["$read", false] }
                  ]
                }
              }
            }
          ],
          as: "unreadMessages"
        }
      },

      {
        $addFields: {
          unreadCount: { $size: "$unreadMessages" },
          lastInteraction: {
            $ifNull: [{ $arrayElemAt: ["$lastMsg.createdAt", 0] }, new Date(0)]
          }
        }
      },

      { $sort: { lastInteraction: -1 } },

      {
        $project: {
          password: 0,
          lastMsg: 0,
          unreadMessages: 0
        }
      }
    ]);

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("User Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}