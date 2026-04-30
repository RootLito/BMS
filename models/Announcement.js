import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    files: [{
        url: String,
        fileName: String,
        fileType: String
    }],
    acknowledgments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

AnnouncementSchema.virtual('responses', {
    ref: 'Response',
    localField: '_id',
    foreignField: 'announcement'
});

export default mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);