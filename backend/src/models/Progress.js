import mongoose from "mongoose";

// One document per (user, problem): solved status, revision bookmark and personal note.
const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", required: true },
  status: { type: String, enum: ["todo", "solved"], default: "todo" },
  bookmarked: { type: Boolean, default: false },
  note: { type: String, default: "", maxlength: 5000 },
  solvedDate: { type: String, default: "" },
  xpAwarded: { type: Boolean, default: false }
}, { timestamps: true });

progressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
export default mongoose.model("Progress", progressSchema);
