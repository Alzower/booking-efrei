import express from "express";
import { getUser, getUsers } from "../controller/user/get-user";
import { createUser } from "../controller/user/create-user";
import { deleteUser } from "../controller/user/delete-user";
import { updateUser } from "../controller/user/update-user";

const userRouter = express.Router();

userRouter.get("/", getUsers);
userRouter.get("/:id", getUser);
userRouter.post("/", createUser);
userRouter.delete("/:id", deleteUser);
userRouter.put("/:id", updateUser);

export default userRouter;
