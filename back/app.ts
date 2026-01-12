import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);

export default app;
