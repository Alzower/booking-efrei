import express from "express";
import { getUser, getUsers } from "../controller/user/get-user";
import { createUser } from "../controller/user/create-user";
import { deleteUser } from "../controller/user/delete-user";
import { updateUser } from "../controller/user/update-user";
import { isAdmin } from "../middleware/admin";
import { userIsAuth } from "../middleware/userIsAuth";

const userRouter = express.Router();

userRouter.get("/", isAdmin, getUsers);
userRouter.get("/me", userIsAuth, getUser);
userRouter.post("/", createUser);
userRouter.delete("/:id", isAdmin, deleteUser);
userRouter.put("/me", userIsAuth, updateUser);

export default userRouter;
