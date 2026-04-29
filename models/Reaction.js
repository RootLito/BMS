import mongoose from "mongoose";

const ReactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    onModel: { type: String, required: true, enum: ['Post', 'Comment'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' }
}, { timestamps: true });

ReactionSchema.index({ user: 1, targetId: 1 }, { unique: true });

export default mongoose.models.Reaction || mongoose.model("Reaction", ReactionSchema);