import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const makeToken = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim() || !email?.trim() || !password) return res.status(400).json({ message: "Username, email and password are required." });
    if (password.length < 6) return res.status(400).json({ message: "Password must contain at least 6 characters." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered." });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username: username.trim(), email: normalizedEmail, password: hashed });
    res.status(201).json({ token: makeToken(user), user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) { res.status(500).json({ message: "Could not create account.", error: error.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password))) return res.status(401).json({ message: "Incorrect email or password." });
    res.json({ token: makeToken(user), user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) { res.status(500).json({ message: "Login failed.", error: error.message }); }
});
export default router;
