import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import PracticeSession from "../models/PracticeSession.js";
import Activity from "../models/Activity.js";
import { addDays, dateFrom } from "../utils/game.js";

const router = Router();
router.use(auth);

// GET /api/heatmap  ->  { days: { "YYYY-MM-DD": count }, total, activeDays }
// count = practice sessions + DSA solves + notes saved on that day (last ~12 months)
router.get("/", async (req, res) => {
  try {
    const end = dateFrom(req);
    const start = addDays(end, -370);
    const match = { userId: new mongoose.Types.ObjectId(req.userId), date: { $gte: start, $lte: end } };
    const group = [{ $match: match }, { $group: { _id: "$date", n: { $sum: 1 } } }];
    const [sessions, activities] = await Promise.all([
      PracticeSession.aggregate(group),
      Activity.aggregate(group)
    ]);
    const days = {};
    for (const row of [...sessions, ...activities]) days[row._id] = (days[row._id] || 0) + row.n;
    const counts = Object.values(days);
    res.json({ days, total: counts.reduce((a, b) => a + b, 0), activeDays: counts.length });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

export default router;
