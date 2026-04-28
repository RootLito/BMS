import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  office: { type: String, required: true },
  unit: { type: String, required: true },
  profile: { type: String, default: "" },
  gender: { type: String, default: "" },
  birthday: { type: Date },
  civilStatus: { type: String, default: "" },
  address: { type: String, default: "" },
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model("User", UserSchema);