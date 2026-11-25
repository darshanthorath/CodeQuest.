import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Session, Mission } from './models.js';
import { levelInfo, XP, bumpStreak, award, BADGES, TEMPLATES } from './game.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

const wrap = (f) => (q, r, n) => f(q, r, n).catch(n);
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
// The client sends its LOCAL date (YYYY-MM-DD) so streaks follow the user's timezone
const dateOf = (q) => {
  const d = q.query.date || q.body?.date;
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().slice(0, 10);
};
const pub = (u) => ({
  id: u._id, username: u.username, email: u.email, totalXP: u.totalXP,
  currentStreak: u.currentStreak, longestStreak: u.longestStreak, achievements: u.achievements,
  totalSessions: u.totalSessions, problemsSolved: u.problemsSolved, totalMinutes: u.totalMinutes,
  ...levelInfo(u.totalXP),
});
const auth = wrap(async (q, r, n) => {
  const t = (q.headers.authorization || '').replace('Bearer ', '');
  try { q.user = await User.findById(jwt.verify(t, process.env.JWT_SECRET).id); } catch {}
  if (!q.user) return r.status(401).json({ error: 'Please log in' });
  n();
});
async function ensureMissions(userId, date) {
  let ms = await Mission.find({ userId, date });
  if (!ms.length) ms = await Mission.insertMany(TEMPLATES.map((t) => ({ ...t, userId, date, xpReward: XP.mission })));
  return ms;
}

app.get('/', (q, r) => r.send('CodeQuest API running'));

// ---- Auth
app.post('/api/auth/register', wrap(async (q, r) => {
  const { username, email, password } = q.body;
  if (!username || !email || !password || password.length < 6)
    return r.status(400).json({ error: 'Username, email and a password of 6+ characters are required' });
  if (await User.findOne({ email: email.toLowerCase() })) return r.status(409).json({ error: 'Email already registered' });
  const u = await User.create({ username, email, password: await bcrypt.hash(password, 10) });
  r.json({ token: sign(u), user: pub(u) });
}));
app.post('/api/auth/login', wrap(async (q, r) => {
  const u = await User.findOne({ email: (q.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(q.body.password || '', u.password)))
    return r.status(401).json({ error: 'Wrong email or password' });
  r.json({ token: sign(u), user: pub(u) });
}));

// ---- Dashboard
app.get('/api/dashboard', auth, wrap(async (q, r) => {
  const u = q.user, date = dateOf(q);
  const [todaySessions, practicedDays, ms] = await Promise.all([
    Session.countDocuments({ userId: u._id, date }),
    Session.distinct('date', { userId: u._id }),
    ensureMissions(u._id, date),
  ]);
  r.json({ user: pub(u), todaySessions, practicedDays, missionsDone: ms.filter((m) => m.completed).length, missionsTotal: ms.length });
}));

// ---- Sessions: the core gamification flow
app.post('/api/sessions', auth, wrap(async (q, r) => {
  const u = q.user, date = dateOf(q);
  const { language, topic, problemTitle, solved, durationMinutes, difficulty, notes, hour } = q.body;
  if (!language || !topic || !(durationMinutes > 0)) return r.status(400).json({ error: 'Language, topic and duration are required' });
  let xp = XP.session + (solved ? XP.problem : 0);
  const s = await Session.create({ userId: u._id, language, topic, problemTitle, solved: !!solved, durationMinutes, difficulty, notes, xpEarned: xp, date });
  u.totalSessions++; u.totalMinutes += durationMinutes; if (solved) u.problemsSolved++;
  const bonus = bumpStreak(u, date); xp += bonus;
  const done = [];
  for (const m of await ensureMissions(u._id, date)) {
    if (m.completed || m.type === 'manual') continue;
    m.progress += m.type === 'problem' ? (solved ? 1 : 0) : m.type === 'minutes' ? durationMinutes : 1;
    if (m.progress >= m.target) { m.completed = true; xp += m.xpReward; done.push(m.title); }
    await m.save();
  }
  u.totalXP += xp;
  const newBadges = award(u, { early: hour < 8 });
  await u.save();
  r.json({ session: s, xpGained: xp, streakBonus: bonus, missionsDone: done, newBadges, user: pub(u) });
}));
app.get('/api/sessions', auth, wrap(async (q, r) =>
  r.json(await Session.find({ userId: q.user._id }).sort({ date: -1, createdAt: -1 }).limit(100))));
app.put('/api/sessions/:id', auth, wrap(async (q, r) => {
  const { language, topic, notes, difficulty } = q.body;
  r.json(await Session.findOneAndUpdate({ _id: q.params.id, userId: q.user._id }, { language, topic, notes, difficulty }, { new: true }));
}));
app.delete('/api/sessions/:id', auth, wrap(async (q, r) => {
  await Session.deleteOne({ _id: q.params.id, userId: q.user._id }); // earned XP is kept
  r.json({ ok: true });
}));

// ---- Missions
app.get('/api/missions', auth, wrap(async (q, r) => r.json(await ensureMissions(q.user._id, dateOf(q)))));
app.post('/api/missions/:id/complete', auth, wrap(async (q, r) => {
  const m = await Mission.findOne({ _id: q.params.id, userId: q.user._id });
  if (!m || m.completed) return r.status(400).json({ error: 'Mission not available' });
  if (m.type !== 'manual') return r.status(400).json({ error: 'This mission completes when you log a session' });
  m.completed = true; m.progress = m.target; await m.save();
  const u = q.user; u.totalXP += m.xpReward;
  const newBadges = award(u); await u.save();
  r.json({ mission: m, newBadges, user: pub(u) });
}));

// ---- Achievements and analytics
app.get('/api/achievements', auth, wrap(async (q, r) =>
  r.json(BADGES.map((b) => ({ key: b.key, name: b.name, desc: b.desc, unlocked: q.user.achievements.includes(b.key) })))));
app.get('/api/analytics', auth, wrap(async (q, r) => {
  const u = q.user, end = dateOf(q);
  const all = await Session.find({ userId: u._id });
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(new Date(end + 'T00:00:00Z') - i * 864e5).toISOString().slice(0, 10);
    week.push({ date: d, minutes: all.filter((s) => s.date === d).reduce((a, s) => a + s.durationMinutes, 0) });
  }
  const langs = {};
  all.forEach((s) => (langs[s.language] = (langs[s.language] || 0) + 1));
  r.json({ week, langs, totals: { sessions: u.totalSessions, problems: u.problemsSolved, minutes: u.totalMinutes, xp: u.totalXP, streak: u.currentStreak, longest: u.longestStreak } });
}));

app.use((e, q, r, n) => { console.error(e); r.status(500).json({ error: 'Something went wrong' }); });
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log('API running')))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
