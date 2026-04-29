import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        default: null
    },
    reacts: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, required: true } 
    }]
}, {
    timestamps: true
});

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);