import express from "express";
import { loginController } from "../controller/auth/auth-user";
const authRouter = express.Router();

authRouter.post("/", loginController);

export default authRouter;
