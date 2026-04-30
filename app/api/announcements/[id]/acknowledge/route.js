import dbConnect from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { userId } = await req.json();
        const { id } = await params; 
        const announcement = await Announcement.findById(id);
        if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const exists = announcement.acknowledgments.find(a => a.user.toString() === userId);

        if (exists) {
            announcement.acknowledgments = announcement.acknowledgments.filter(a => a.user.toString() !== userId);
        } else {
            announcement.acknowledgments.push({ user: userId });
        }

        await announcement.save();
        return NextResponse.json(announcement);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}