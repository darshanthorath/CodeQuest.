import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Problem, { DIFFICULTIES } from "../models/Problem.js";
import Progress from "../models/Progress.js";
import Activity from "../models/Activity.js";
import { SOLVE_XP, dateFrom, touchStreak } from "../utils/game.js";

const router = Router();
router.use(auth);

const visibleTo = (userId) => ({ $or: [{ userId: null }, { userId }] });

// GET /api/problems  ->  every sheet question + this user's progress on it
router.get("/", async (req, res) => {
  try {
    const [problems, progress] = await Promise.all([
      Problem.find(visibleTo(req.userId)).sort({ order: 1, createdAt: 1 }).lean(),
      Progress.find({ userId: req.userId }).lean()
    ]);
    const byProblem = new Map(progress.map((p) => [String(p.problemId), p]));
    res.json(problems.map((p) => {
      const g = byProblem.get(String(p._id));
      return {
        _id: p._id, title: p.title, topic: p.topic, difficulty: p.difficulty, url: p.url,
        custom: Boolean(p.userId),
        status: g?.status || "todo",
        bookmarked: Boolean(g?.bookmarked),
        note: g?.note || "",
        solvedDate: g?.solvedDate || ""
      };
    }));
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/problems  ->  add your own question to the sheet
router.post("/", async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const topic = String(req.body.topic || "").trim();
    const difficulty = DIFFICULTIES.includes(req.body.difficulty) ? req.body.difficulty : "Medium";
    const url = String(req.body.url || "").trim();
    if (!title || !topic) return res.status(400).json({ message: "Question title and topic are required." });
    if (title.length > 200 || topic.length > 60) return res.status(400).json({ message: "Title or topic is too long." });
    if (url && !/^https?:\/\//i.test(url)) return res.status(400).json({ message: "Link must start with http:// or https://" });
    const problem = await Problem.create({ userId: req.userId, title, topic, difficulty, url });
    res.status(201).json({ problem, message: "Question added to your sheet." });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

// DELETE /api/problems/:id  ->  only your own custom questions
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid question ID." });
    const problem = await Problem.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!problem) return res.status(404).json({ message: "Only questions you added yourself can be deleted." });
    await Promise.all([
      Progress.deleteMany({ userId: req.userId, problemId: problem._id }),
      Activity.deleteMany({ userId: req.userId, ref: problem._id })
    ]);
    res.json({ message: "Question deleted." });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/problems/:id/progress  ->  { status?: "todo"|"solved", bookmarked?: bool, note?: string }
router.put("/:id/progress", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid question ID." });
    const problem = await Problem.findOne({ _id: req.params.id, ...visibleTo(req.userId) });
    if (!problem) return res.status(404).json({ message: "Question not found." });

    const { status, bookmarked, note } = req.body;
    if (status !== undefined && !["todo", "solved"].includes(status)) {
      return res.status(400).json({ message: "Status must be todo or solved." });
    }
    const date = dateFrom(req);

    const progress = await Progress.findOneAndUpdate(
      { userId: req.userId, problemId: problem._id },
      { $setOnInsert: { status: "todo" } },
      { upsert: true, new: true }
    );

    if (bookmarked !== undefined) progress.bookmarked = Boolean(bookmarked);
    if (note !== undefined) progress.note = String(note).slice(0, 5000);

    let xpGained = 0;
    let user = null;
    if (status && status !== progress.status) {
      user = await User.findById(req.userId);
      progress.status = status;
      if (status === "solved") {
        progress.solvedDate = date;
        await Activity.create({ userId: req.userId, date, kind: "solve", ref: problem._id });
        await touchStreak(user, date);
        if (!progress.xpAwarded) {          // XP only the first time a problem is solved
          xpGained = SOLVE_XP[problem.difficulty] || 30;
          progress.xpAwarded = true;
          user.totalXP += xpGained;
        }
        await user.save();
      } else {
        progress.solvedDate = "";
        await Activity.deleteMany({ userId: req.userId, kind: "solve", ref: problem._id });
      }
    }
    await progress.save();

    res.json({
      progress,
      xpGained,
      totalXP: user?.totalXP,
      currentStreak: user?.currentStreak,
      message: xpGained ? `Solved! +${xpGained} XP` : "Progress saved."
    });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

export default router;
