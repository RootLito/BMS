import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    trim: true,
    validate: {
      validator: function () {
        return this.content || (this.files && this.files.length > 0);
      },
      message: "Post must contain either text content or files (image/video)."
    }
  },
  files: [
    {
      url: { type: String, required: true },
      fileName: { type: String },
      fileType: { type: String, required: true },
    },
  ],
  reacts: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["like", "love", "haha", "wow", "sad", "angry"],
      default: "like"
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Post || mongoose.model("Post", PostSchema);