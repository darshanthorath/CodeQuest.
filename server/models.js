import mongoose from 'mongoose';
const { Schema, model } = mongoose;
export const User = model('User', new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  totalXP: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastDate: String,
  achievements: [String],
  totalSessions: { type: Number, default: 0 },
  problemsSolved: { type: Number, default: 0 },
  totalMinutes: { type: Number, default: 0 },
}, { timestamps: true }));
export const Session = model('Session', new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  language: String, topic: String, problemTitle: String, solved: Boolean,
  durationMinutes: Number, difficulty: String, notes: String, xpEarned: Number, date: String,
}, { timestamps: true }));
export const Mission = model('Mission', new Schema({
  userId: { type: Schema.Types.ObjectId, index: true },
  title: String, type: String, target: Number,
  progress: { type: Number, default: 0 },
  xpReward: { type: Number, default: 100 },
  completed: { type: Boolean, default: false },
  date: String,
}));
