import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  language: { type: String, required: true, trim: true },
  topic: { type: String, required: true, trim: true },
  problemTitle: { type: String, default: "", trim: true },
  durationMinutes: { type: Number, required: true, min: 1, max: 1440 },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
  solvedProblem: { type: Boolean, default: false },
  notes: { type: String, default: "", maxlength: 2000 },
  date: { type: String, required: true },
  xpEarned: { type: Number, default: 20 }
}, { timestamps: true });

export default mongoose.model("PracticeSession", sessionSchema);
