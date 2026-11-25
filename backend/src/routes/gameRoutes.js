import { Router } from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import PracticeSession from "../models/PracticeSession.js";
import Mission from "../models/Mission.js";
import { levelForXP, levelName, todayString } from "../utils/game.js";

const router = Router();
router.use(auth);

const missionTemplates = [
  ["Practice coding for at least 20 minutes", "Build your daily coding habit.", 30],
  ["Solve one coding problem", "Try a problem on arrays, strings or logic.", 40],
  ["Write down one thing you learned", "Reflect on today's learning.", 30]
];

async function getOrCreateMissions(userId, date) {
  for (const [title, description, xpReward] of missionTemplates) {
    await Mission.updateOne({ userId, date, title }, { $setOnInsert: { userId, date, title, description, xpReward } }, { upsert: true });
  }
  return Mission.find({ userId, date, title: { $ne: "Daily mission completion bonus" } }).sort({ createdAt: 1 });
}

router.get("/dashboard", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    const sessions = await PracticeSession.find({ userId: req.userId });
    const today = todayString();
    const todaySessions = sessions.filter(s => s.date === today);
    const missions = await getOrCreateMissions(req.userId, today);
    const level = levelForXP(user.totalXP);
    res.json({
      user: { username: user.username, email: user.email, totalXP: user.totalXP, level, levelName: levelName(level), currentStreak: user.currentStreak, longestStreak: user.longestStreak },
      stats: {
        totalSessions: sessions.length,
        problemsSolved: sessions.filter(s => s.solvedProblem).length,
        totalMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
        todayMinutes: todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0),
        xpToNextLevel: 500 - (user.totalXP % 500)
      },
      missions
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get("/missions", async (req, res) => {
  try { res.json(await getOrCreateMissions(req.userId, todayString())); }
  catch (error) { res.status(500).json({ message: error.message }); }
});

router.post("/missions/:id/complete", async (req, res) => {
  try {
    const mission = await Mission.findOne({ _id: req.params.id, userId: req.userId, date: todayString() });
    if (!mission) return res.status(404).json({ message: "Mission not found." });
    if (mission.completed) return res.status(400).json({ message: "Mission already completed." });
    mission.completed = true;
    await mission.save();
    const user = await User.findById(req.userId);
    user.totalXP += mission.xpReward;
    await user.save();
    const all = await Mission.find({ userId: req.userId, date: todayString() });
    let bonusXP = 0;
    if (all.length && all.every(m => m.completed)) {
      // Award the daily completion bonus only once, tracked by a mission marker.
      const markerTitle = "Daily mission completion bonus";
      const marker = await Mission.findOne({ userId: req.userId, date: todayString(), title: markerTitle });
      if (!marker) {
        await Mission.create({ userId: req.userId, date: todayString(), title: markerTitle, description: "All daily missions completed", xpReward: 100, completed: true });
        user.totalXP += 100;
        bonusXP = 100;
        await user.save();
      }
    }
    res.json({ mission, totalXP: user.totalXP, bonusXP, message: `Mission completed! +${mission.xpReward + bonusXP} XP` });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get("/achievements", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const sessions = await PracticeSession.find({ userId: req.userId });
    const solved = sessions.filter(s => s.solvedProblem).length;
    const level = levelForXP(user.totalXP);
    const definitions = [
      { id: "first-session", name: "First Steps", description: "Record your first coding session.", unlocked: sessions.length >= 1, icon: "🚀" },
      { id: "problem-solver", name: "Problem Solver", description: "Solve 25 coding problems.", unlocked: solved >= 25, icon: "🧩", progress: `${Math.min(solved,25)}/25` },
      { id: "streak-7", name: "7-Day Streak", description: "Practice for 7 consecutive days.", unlocked: user.longestStreak >= 7, icon: "🔥", progress: `${Math.min(user.longestStreak,7)}/7` },
      { id: "level-10", name: "Code Master", description: "Reach level 10.", unlocked: level >= 10, icon: "👑", progress: `${Math.min(level,10)}/10` },
      { id: "hours-10", name: "Dedicated Coder", description: "Practice for 10 total hours.", unlocked: sessions.reduce((n,s)=>n+s.durationMinutes,0) >= 600, icon: "⏱️" }
    ];
    res.json(definitions);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get("/analytics", async (req, res) => {
  try {
    const sessions = await PracticeSession.find({ userId: req.userId });
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - (6 - i));
      return d.toISOString().slice(0,10);
    });
    const weekly = days.map(date => ({
      date, minutes: sessions.filter(s => s.date === date).reduce((n,s)=>n+s.durationMinutes,0),
      sessions: sessions.filter(s => s.date === date).length
    }));
    const languages = {};
    sessions.forEach(s => { languages[s.language] = (languages[s.language] || 0) + s.durationMinutes; });
    res.json({
      weekly,
      languages: Object.entries(languages).map(([language, minutes]) => ({ language, minutes })),
      totalSessions: sessions.length,
      totalMinutes: sessions.reduce((n,s)=>n+s.durationMinutes,0),
      solved: sessions.filter(s=>s.solvedProblem).length
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
export default router;
