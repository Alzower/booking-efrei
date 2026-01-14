import express from "express";
import { loginController } from "../controller/auth/auth-user.ts";
import { loginLimiter } from "../middleware/rateLimiter.ts";
const authRouter = express.Router();

authRouter.post("/", loginLimiter, loginController);

export default authRouter;
