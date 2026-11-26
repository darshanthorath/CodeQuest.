export const levelForXP = (xp) => Math.floor(xp / 500) + 1;
export const levelName = (level) => {
  const names = ["Code Beginner", "Logic Learner", "Code Explorer", "Bug Hunter", "Algorithm Knight", "Code Master"];
  return names[Math.min(level - 1, names.length - 1)] || "Legendary Coder";
};

// XP for solving a DSA sheet problem for the FIRST time (re-solving gives no extra XP)
export const SOLVE_XP = { Easy: 30, Medium: 50, Hard: 80 };
// XP for saving a note (limited per day so it cannot be farmed)
export const NOTE_XP = 10;
export const NOTE_XP_DAILY_LIMIT = 3;

export const todayString = () => new Date().toISOString().slice(0, 10);

export const addDays = (dateString, days) => {
  const d = new Date(`${dateString}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// The browser sends its LOCAL date as ?date=YYYY-MM-DD so streaks, missions and the
// activity heatmap follow the user's own timezone (important for India, UTC+5:30).
export const dateFrom = (req) => {
  const d = req.query?.date;
  if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return todayString();
  if (Number.isNaN(Date.parse(`${d}T00:00:00Z`))) return todayString();
  if (d > addDays(todayString(), 1)) return todayString(); // no future dates
  return d;
};

export async function updateStreak(user, practiceDate) {
  if (!user.lastPracticeDate) {
    user.currentStreak = 1;
  } else if (user.lastPracticeDate === practiceDate) {
    // Multiple activities on one day do not increase the streak.
  } else {
    const previous = new Date(`${user.lastPracticeDate}T00:00:00Z`);
    const current = new Date(`${practiceDate}T00:00:00Z`);
    const difference = Math.round((current - previous) / 86400000);
    if (difference === 1) user.currentStreak += 1;
    else if (difference > 1) user.currentStreak = 1;
    else throw new Error("Practice date cannot be earlier than your last recorded practice.");
  }
  user.lastPracticeDate = practiceDate;
  user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
}

// Same as updateStreak, but silently ignores dates older than the last practice day.
// Used for DSA solves and notes, which should never fail because of the streak.
export async function touchStreak(user, practiceDate) {
  if (user.lastPracticeDate && practiceDate < user.lastPracticeDate) return;
  await updateStreak(user, practiceDate);
}
