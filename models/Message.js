import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, trim: true },
    files: [
      {
        url: { type: String },
        fileName: { type: String },
        fileType: { type: String }, 
      },
    ],
    seen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);
