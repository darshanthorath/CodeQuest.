import mongoose from "mongoose";

// One row per DSA solve or saved note. Together with practice sessions this feeds the
// LeetCode-style green activity heatmap.
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  kind: { type: String, enum: ["solve", "note"], required: true },
  ref: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

activitySchema.index({ userId: 1, date: 1 });
export default mongoose.model("Activity", activitySchema);
