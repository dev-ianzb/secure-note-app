import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import User from "./models/tbl_users.model.js";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();
app.use(express.json());
// app.get("/", (req, res) => {
//   res.send("Hello, Secure Note App!");
// });
app.post("/api/users", async (req, res) => {
  const user = req.body;
  if (!user.username || !user.email || !user.password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  //   const newUser = new User(user);
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    const newUser = new User({
      ...user,
      password: hashedPassword,
    });
    await newUser.save();
    res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error creating user", error });
  }
});

app.listen(5000, () => {
  connectDB();
  console.log("Server is running on port 5000 http://localhost:5000");
});
