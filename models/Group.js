import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  groupAvatar: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.models.Group || mongoose.model("Group", GroupSchema);