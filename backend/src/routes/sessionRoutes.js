import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import PracticeSession from "../models/PracticeSession.js";
import { updateStreak } from "../utils/game.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res) => {
  try {
    const sessions = await PracticeSession.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 }).limit(100);
    res.json(sessions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/", async (req, res) => {
  try {
    const { language, topic, problemTitle, durationMinutes, difficulty, solvedProblem, notes, date } = req.body;
    if (!language?.trim() || !topic?.trim() || !Number.isFinite(Number(durationMinutes)) || Number(durationMinutes) < 1) {
      return res.status(400).json({ message: "Language, topic and a valid duration are required." });
    }
    const practiceDate = date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(practiceDate)) return res.status(400).json({ message: "Invalid date." });
    const xpEarned = 20 + (solvedProblem ? 50 : 0);
    const user = await User.findById(req.userId);
    await updateStreak(user, practiceDate);
    user.totalXP += xpEarned;
    await user.save();
    const session = await PracticeSession.create({
      userId: req.userId, language, topic, problemTitle, durationMinutes: Number(durationMinutes),
      difficulty, solvedProblem: Boolean(solvedProblem), notes, date: practiceDate, xpEarned
    });
    res.status(201).json({ session, totalXP: user.totalXP, currentStreak: user.currentStreak, message: `Session saved! You earned ${xpEarned} XP.` });
  } catch (error) { res.status(400).json({ message: error.message || "Could not save session." }); }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid session ID." });
    const allowed = ["language", "topic", "problemTitle", "durationMinutes", "difficulty", "solvedProblem", "notes", "date"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const session = await PracticeSession.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true, runValidators: true });
    if (!session) return res.status(404).json({ message: "Session not found." });
    res.json({ session, message: "Session updated. XP is not recalculated for edited sessions." });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const session = await PracticeSession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!session) return res.status(404).json({ message: "Session not found." });
    // Keep earned XP as a reward history; deleting a log does not remove previously earned XP.
    res.json({ message: "Practice log deleted. Previously earned XP remains unchanged." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
export default router;
