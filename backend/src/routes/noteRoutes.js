import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Note from "../models/Note.js";
import Activity from "../models/Activity.js";
import { NOTE_XP, NOTE_XP_DAILY_LIMIT, dateFrom, touchStreak } from "../utils/game.js";

const router = Router();
router.use(auth);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file
// Allow-list by extension. The content type we store/serve comes from THIS table, never
// from the browser, and HTML/SVG/JS are not allowed (so an uploaded file can never run code).
const TYPES = {
  pdf: "application/pdf",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  txt: "text/plain", md: "text/markdown",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};
const extOf = (name = "") => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
// multer reads file names as latin1; convert so names like "नोट्स.pdf" survive
const cleanName = (name = "") => Buffer.from(name, "latin1").toString("utf8").replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 150);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (TYPES[extOf(file.originalname)]) return cb(null, true);
    const error = new Error("Unsupported file type. Use PDF, image, TXT, MD, DOC/DOCX or PPT/PPTX.");
    error.status = 400;
    cb(error);
  }
});

function uploadOne(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "File is too large. Maximum size is 5 MB." });
    if (err.status === 400 || err.name === "MulterError") return res.status(400).json({ message: err.message });
    next(err);
  });
}

// GET /api/notes  ->  list (file bytes are never included)
router.get("/", async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(300).lean();
    res.json(notes.map((n) => ({
      _id: n._id, title: n.title, topic: n.topic, text: n.text, date: n.date,
      fileName: n.fileName, fileType: n.fileType, fileSize: n.fileSize, hasFile: Boolean(n.fileName)
    })));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/notes  (multipart/form-data: title, topic, text, file)
router.post("/", uploadOne, async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const topic = String(req.body.topic || "").trim() || "General";
    const text = String(req.body.text || "").trim();
    if (!title) return res.status(400).json({ message: "Please give your note a title." });
    if (title.length > 120 || topic.length > 60) return res.status(400).json({ message: "Title or topic is too long." });
    if (text.length > 20000) return res.status(400).json({ message: "Written notes can be at most 20,000 characters." });
    if (!req.file && !text) return res.status(400).json({ message: "Add a file or write some notes first." });

    const date = dateFrom(req);
    const doc = { userId: req.userId, title, topic, text, date };
    if (req.file) {
      const ext = extOf(req.file.originalname);
      doc.fileName = cleanName(req.file.originalname);
      doc.fileType = TYPES[ext];
      doc.fileSize = req.file.size;
      doc.data = req.file.buffer;
    }
    const note = await Note.create(doc);

    const user = await User.findById(req.userId);
    const savedToday = await Activity.countDocuments({ userId: req.userId, date, kind: "note" });
    await Activity.create({ userId: req.userId, date, kind: "note", ref: note._id });
    const xpGained = savedToday < NOTE_XP_DAILY_LIMIT ? NOTE_XP : 0;
    user.totalXP += xpGained;
    await touchStreak(user, date);
    await user.save();

    res.status(201).json({
      note: { _id: note._id, title, topic, text, date, fileName: doc.fileName || "", fileType: doc.fileType || "", fileSize: doc.fileSize || 0, hasFile: Boolean(doc.fileName) },
      xpGained,
      message: xpGained ? `Note saved! +${xpGained} XP` : "Note saved."
    });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// GET /api/notes/:id/file  ->  the uploaded file (owner only)
router.get("/:id/file", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid note ID." });
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId }).select("+data fileName fileType");
    if (!note || !note.fileName || !note.data) return res.status(404).json({ message: "File not found." });
    res.set({
      "Content-Type": note.fileType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(note.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store"
    });
    res.send(Buffer.from(note.data));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid note ID." });
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!note) return res.status(404).json({ message: "Note not found." });
    res.json({ message: "Note deleted. XP you already earned stays." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
