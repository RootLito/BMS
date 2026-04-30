import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Announcement from "@/models/Announcement";
import ResponseModel from "@/models/Response";
import fs from "fs/promises";
import path from "path";

export async function GET() {
    try {
        await dbConnect();
        const announcements = await Announcement.find({})
            .populate("author", "fullname profile office unit image")
            .sort({ createdAt: -1 });
        const announcementsWithCounts = await Promise.all(
            announcements.map(async (ann) => {
                const responses = await ResponseModel.find({ announcement: ann._id })
                    .select('_id');
                const annObj = ann.toObject();
                annObj.responses = responses;
                return annObj;
            })
        );
        return NextResponse.json(announcementsWithCounts);
    } catch (error) {
        console.error("Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const formData = await req.formData();
        const content = formData.get("content");
        const author = formData.get("author");
        const title = formData.get("title") || "Official Announcement";
        const uploadDir = path.join(process.cwd(), "public", "announcements");
        try {
            await fs.access(uploadDir);
        } catch {
            await fs.mkdir(uploadDir, { recursive: true });
        }

        const filesData = [];
        const uploadedFiles = formData.getAll("files");

        for (const file of uploadedFiles) {
            if (file instanceof File) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const filename = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
                const filePath = path.join(uploadDir, filename);
                await fs.writeFile(filePath, buffer);
                filesData.push({
                    url: `/announcements/${filename}`,
                    name: file.name,
                    type: file.type
                });
            }
        }
        const newAnnouncement = await Announcement.create({
            author,
            title,
            content,
            files: filesData,
            acknowledgments: []
        });

        const populated = await newAnnouncement.populate("author", "fullname profile office unit");
        return NextResponse.json(populated, { status: 201 });

    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}