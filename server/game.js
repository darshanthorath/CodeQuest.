// Gamification engine: XP, levels, streaks, badges, daily missions
export const TITLES = ['Code Beginner', 'Logic Learner', 'Code Explorer', 'Bug Hunter', 'Algorithm Knight', 'Code Master'];
export const XP_PER_LEVEL = 500; // Level 1: 0-499, Level 2: 500-999, ...
export const XP = { session: 20, problem: 50, mission: 100, streak7: 100 };

export const levelInfo = (xp) => {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  return { level, title: TITLES[Math.min(level, TITLES.length) - 1], into: xp % XP_PER_LEVEL, need: XP_PER_LEVEL };
};

const ms = (s) => new Date(s + 'T00:00:00Z').getTime();
export const diffDays = (a, b) => Math.round((ms(b) - ms(a)) / 864e5);

// Updates streak fields on the user; returns bonus XP (every 7th consecutive day)
export function bumpStreak(u, date) {
  if (u.lastDate === date) return 0;
  u.currentStreak = u.lastDate && diffDays(u.lastDate, date) === 1 ? u.currentStreak + 1 : 1;
  u.lastDate = date;
  u.longestStreak = Math.max(u.longestStreak, u.currentStreak);
  return u.currentStreak % 7 === 0 ? XP.streak7 : 0;
}

export const BADGES = [
  { key: 'first', name: 'First Step', desc: 'Log your first session', ok: (u) => u.totalSessions >= 1 },
  { key: 'streak7', name: '7-Day Streak', desc: 'Practice 7 days in a row', ok: (u) => u.longestStreak >= 7 },
  { key: 'solver25', name: 'Problem Solver', desc: 'Solve 25 problems', ok: (u) => u.problemsSolved >= 25 },
  { key: 'master', name: 'Code Master', desc: 'Reach level 10', ok: (u) => u.level >= 10 },
  { key: 'early', name: 'Early Bird', desc: 'Log a session before 8 AM', ok: (u, c) => !!c?.early },
];

// Recalculate level and unlock badges; returns names of newly unlocked badges
export function award(u, ctx) {
  u.level = levelInfo(u.totalXP).level;
  const got = [];
  for (const b of BADGES) {
    if (!u.achievements.includes(b.key) && b.ok(u, ctx)) { u.achievements.push(b.key); got.push(b.name); }
  }
  return got;
}

export const TEMPLATES = [
  { title: 'Solve 1 coding problem', type: 'problem', target: 1 },
  { title: 'Practice for 30 minutes', type: 'minutes', target: 30 },
  { title: 'Log 1 practice session', type: 'session', target: 1 },
  { title: "Review yesterday's code", type: 'manual', target: 1 },
];
