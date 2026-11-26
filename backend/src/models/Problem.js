import mongoose from "mongoose";

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

// userId = null  -> built-in DSA sheet question (shared by everybody)
// userId = <id>  -> custom question added by that user
const problemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  topic: { type: String, required: true, trim: true, maxlength: 60 },
  difficulty: { type: String, enum: DIFFICULTIES, default: "Medium" },
  url: { type: String, default: "", trim: true, maxlength: 500 },
  order: { type: Number, default: 100000 }
}, { timestamps: true });

problemSchema.index({ userId: 1, title: 1 });
export default mongoose.model("Problem", problemSchema);
