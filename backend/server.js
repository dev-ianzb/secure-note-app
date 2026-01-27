import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import routes from "./routes/route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/", routes);

app.listen(5000, () => {
  connectDB();
  console.log("Server is running on port 5000 http://localhost:5000");
});
