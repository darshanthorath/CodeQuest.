# CodeQuest – Gamified Coding Habit Tracker

A full-stack MERN-style app with React, Vite, Express, MongoDB, JWT, Chart.js.

## Features
- **DSA sheet** (TakeUForward / LeetCode style): 120+ questions in 15 topics (Arrays, Linked List, Trees, Graphs, DP...). Tick questions as solved, star them for revision, keep a personal note on each question, filter by topic / difficulty / status, and add your own questions.
- **Notes**: upload PDFs, images, TXT/MD, DOC/DOCX or PPT/PPTX (max 5 MB) and/or write notes in the browser. Search by topic, view or download any time.
- **Activity calendar**: a LeetCode-style green-dot heatmap for the last 12 months. Practice sessions, DSA solves and saved notes all count.
- Gamification: XP, levels, streaks, daily missions, achievements and analytics.

## Requirements
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- VS Code

## 1. Configure the backend
Open a terminal in `backend`:
```bash
npm install
```
(`multer` was added for file uploads, so run this again after updating the project.)
Copy `.env.example` to `.env` and set:
- `MONGO_URI` to your MongoDB connection string
- `JWT_SECRET` to a long random secret
- `PORT=5000`

Start backend:
```bash
npm run dev
```
Expected: `CodeQuest API running on port 5000` and `MongoDB connected`.

## 2. Configure the frontend
Open a second terminal in `frontend`:
```bash
npm install
```
Start:
```bash
npm run dev
```
Open the URL Vite prints, usually http://localhost:5173.

## 3. Use the app
1. Register a new account.
2. Log in.
3. Open **DSA Sheet**, expand a topic and tick the questions you solve.
4. Open **Notes** to upload or write notes.
5. Add practice sessions, then check the dashboard for XP, streak, calendar, missions and achievements.

The DSA sheet is created automatically the first time the backend starts
(`DSA sheet ready (122 questions)` in the terminal). Edit `backend/src/data/problemSeed.js`
to add more built-in questions; they appear for everyone on the next restart.

## XP rules
- Every valid practice session: +20 XP
- Marking a problem solved: additional +50 XP
- Complete all three daily missions: +100 XP once per day
- Solve a DSA sheet question for the first time: Easy +30, Medium +50, Hard +80 XP (un-ticking and re-ticking gives no extra XP)
- Save a note: +10 XP (first 3 notes per day)
- Level = floor(totalXP / 500) + 1

## API
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/dashboard`
- GET/POST/PUT/DELETE `/api/sessions`
- GET `/api/missions`
- POST `/api/missions/:id/complete`
- GET `/api/achievements`
- GET `/api/analytics`
- GET `/api/problems`, POST `/api/problems` (add your own question), DELETE `/api/problems/:id` (own questions only)
- PUT `/api/problems/:id/progress` with `{ status: "todo" | "solved", bookmarked, note }`
- GET `/api/notes`, POST `/api/notes` (multipart: `title`, `topic`, `text`, `file`), GET `/api/notes/:id/file`, DELETE `/api/notes/:id`
- GET `/api/heatmap` returns `{ days: { "YYYY-MM-DD": count }, total, activeDays }`

All endpoints except register/login require `Authorization: Bearer <token>`.

## Notes
- This is an MVP starter project, not a production-audited application.
- Use a strong unique JWT secret and never commit `.env`.
- Streak, mission and calendar dates use the browser's local date (sent as `?date=YYYY-MM-DD`), so they follow your own timezone.
- Uploaded files are stored in MongoDB (5 MB max each) and only their owner can open them. HTML, SVG and script files are not accepted.
- The `client` and `server` folders are an older unused copy; the app runs from `frontend` and `backend`.
- Daily missions are generated for the current date and stored per user.
