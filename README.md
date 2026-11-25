# CodeQuest – Gamified Coding Habit Tracker

A full-stack MERN-style MVP with React, Vite, Express, MongoDB, JWT, Chart.js.

## Requirements
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- VS Code

## 1. Configure the backend
Open a terminal in `backend`:
```bash
npm install
```
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
3. Add a practice session. Choose whether you solved a problem.
4. Check dashboard XP, streak, mission and achievements.
5. Use the navigation to view practice history and analytics.

## XP rules
- Every valid practice session: +20 XP
- Marking a problem solved: additional +50 XP
- Complete all three daily missions: +100 XP once per day
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

All endpoints except register/login require `Authorization: Bearer <token>`.

## Notes
- This is an MVP starter project, not a production-audited application.
- Use a strong unique JWT secret and never commit `.env`.
- Streak dates are based on the date submitted by the browser.
- Daily missions are generated for the current date and stored per user.
