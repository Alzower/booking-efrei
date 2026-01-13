import express from "express";
import { createRoom } from "../controller/room/create-room.ts";
import { isAdmin } from "../middleware/admin.ts";
import { updateRoom } from "../controller/room/update-room.ts";
import { getRoomById, getRooms } from "../controller/room/get-room.ts";
import { deleteRoom } from "../controller/room/delete-room.ts";

const roomRouter = express.Router();

roomRouter.post("/", isAdmin, createRoom);
roomRouter.put("/:id", isAdmin, updateRoom);
roomRouter.get("/", getRooms);
roomRouter.get("/:id", getRoomById);
roomRouter.delete("/:id", isAdmin, deleteRoom);

export default roomRouter;
