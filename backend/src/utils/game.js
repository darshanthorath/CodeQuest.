export const levelForXP = (xp) => Math.floor(xp / 500) + 1;
export const levelName = (level) => {
  const names = ["Code Beginner", "Logic Learner", "Code Explorer", "Bug Hunter", "Algorithm Knight", "Code Master"];
  return names[Math.min(level - 1, names.length - 1)] || "Legendary Coder";
};
export const todayString = () => new Date().toISOString().slice(0, 10);

export async function updateStreak(user, practiceDate) {
  if (!user.lastPracticeDate) {
    user.currentStreak = 1;
  } else if (user.lastPracticeDate === practiceDate) {
    // Multiple sessions on one day do not increase the streak.
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
