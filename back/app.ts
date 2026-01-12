import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import roomRouter from "./routes/room";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRouter);

export default app;
