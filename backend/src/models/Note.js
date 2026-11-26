import mongoose from "mongoose";

// A note is written text, an uploaded file, or both.
// The file bytes live in `data` (max 5 MB) and are never returned by list queries (select: false).
const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  topic: { type: String, default: "General", trim: true, maxlength: 60 },
  text: { type: String, default: "", maxlength: 20000 },
  fileName: { type: String, default: "" },
  fileType: { type: String, default: "" },
  fileSize: { type: Number, default: 0 },
  data: { type: Buffer, select: false },
  date: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Note", noteSchema);
