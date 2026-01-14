import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import roomRouter from "./routes/room";
import reservationRouter from "./routes/reservation";
import { userIsAuth } from "./middleware/userIsAuth";

dotenv.config();
const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/reservation", userIsAuth, reservationRouter);

export default app;
