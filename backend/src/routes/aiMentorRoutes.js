
import { Router } from "express";
import auth from "../middleware/auth.js";
import { mentorChat } from "../controllers/aiMentorController.js";

const router = Router();

router.post("/chat", auth, mentorChat);

export default router;
