import express from "express";
import User from "../models/tbl_users.model.js";
import Notes from "../models/tbl_notes.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const router = express.Router();
//Login and Register routes
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const emailToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      emailToken,
      isVerified: false,
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const url = `http://localhost:5000/api/verify/${emailToken}`;
    await transporter.sendMail({
      to: email,
      subject: "Verify your account",
      html: `
        <h2>Verify your account</h2>
        <p>Click the link below to activate your account:</p>
        <a href="${url}">${url}</a>
      `,
    });
    res.status(201).json({
      success: true,
      message:
        "Registration successful. Check your email to verify your account.",
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Registration failed", err });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const user = await User.findOne({ emailToken: req.params.token });

    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    user.isVerified = true;
    user.emailToken = undefined;
    await user.save();

    res.send("Email verified! You can now log in.");
  } catch (err) {
    res.status(500).send("Verification failed");
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in user",
      error,
    });
  }
});

// Notes routes
router.post("/notes", async (req, res) => {
  const { username, title, content } = req.body;

  if (!username || !content) {
    return res
      .status(400)
      .json({ success: false, message: "Username and content are required" });
  }
  const newNote = new Notes({
    username,
    title,
    content,
  });
  try {
    await newNote.save();
    res
      .status(201)
      .json({ success: true, message: "Note created successfully", newNote });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to create note", err });
  }
});

router.delete("/notes/:id", async (req, res) => {
  try {
    const deletedNote = await Notes.findByIdAndDelete(req.params.id);
    if (!deletedNote) {
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Note deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete note", err });
  }
});

export default router;
