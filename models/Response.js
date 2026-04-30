import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema({
  announcement: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Announcement", 
    required: true 
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Response || mongoose.model("Response", ResponseSchema);