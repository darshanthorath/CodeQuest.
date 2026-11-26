
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/authRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
import gameRoutes from "./src/routes/gameRoutes.js";
import dsaRoutes from "./src/routes/dsaRoutes.js";
import noteRoutes from "./src/routes/noteRoutes.js";
import activityRoutes from "./src/routes/activityRoutes.js";
import { seedProblems } from "./src/data/problemSeed.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "CodeQuest API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/problems", dsaRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/heatmap", activityRoutes);
app.use("/api", gameRoutes);

// Last-resort error handler so unexpected errors return JSON instead of an HTML page
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    const count = await seedProblems();
    console.log(`DSA sheet ready (${count} questions)`);
    app.listen(PORT, () => {
      console.log(`CodeQuest API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
