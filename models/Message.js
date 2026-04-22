import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },

  content: { type: String, trim: true },
  files: [
    {
      url: { type: String },
      fileName: { type: String },
      fileType: { type: String }, 
    },
  ],
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);