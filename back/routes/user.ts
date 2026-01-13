import express from "express";
import { getUser, getUsers } from "../controller/user/get-user.ts";
import { createUser } from "../controller/user/create-user.ts";
import { deleteUser } from "../controller/user/delete-user.ts";
import { updateUser } from "../controller/user/update-user.ts";
import { isAdmin } from "../middleware/admin.ts";
import { userIsAuth } from "../middleware/userIsAuth.ts";

const userRouter = express.Router();

userRouter.get("/", isAdmin, getUsers);
userRouter.get("/me", userIsAuth, getUser);
userRouter.post("/", createUser);
userRouter.delete("/:id", isAdmin, deleteUser);
userRouter.put("/me", userIsAuth, updateUser);

export default userRouter;
