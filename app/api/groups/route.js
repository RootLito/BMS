import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Group from "@/models/Group";


export async function GET() {
    try {
        await dbConnect();

        const session = await auth();

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id || session.user._id;

        const groups = await Group.find({
            members: { $in: [userId] }
        })
            .populate("members", "fullname office")
            .populate("createdBy", "fullname")
            .sort({ createdAt: -1 });

        return NextResponse.json(groups, { status: 200 });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch groups" },
            { status: 500 }
        );
    }
}


export async function POST(req) {
    try {
        await dbConnect();
        const { name, members, createdBy } = await req.json();

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Group name is required" }, { status: 400 });
        }

        const groupMembers = members && Array.isArray(members)
            ? [...new Set([...members, createdBy])]
            : [createdBy];

        const newGroup = await Group.create({
            name: name,
            members: groupMembers,
            createdBy: createdBy,
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate("members", "fullname office")
            .populate("createdBy", "fullname");

        return NextResponse.json(populatedGroup, { status: 201 });
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create group" },
            { status: 500 }
        );
    }
}