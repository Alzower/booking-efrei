import express from "express";
import { createRoom } from "../controller/room/create-room";
import { isAdmin } from "../middleware/admin";
import { updateRoom } from "../controller/room/update-room";
import { getRoomById, getRooms } from "../controller/room/get-room";
import { deleteRoom } from "../controller/room/delete-room";

const roomRouter = express.Router();

roomRouter.post("/", isAdmin, createRoom);
roomRouter.put("/:id", isAdmin, updateRoom);
roomRouter.get("/", getRooms);
roomRouter.get("/:id", getRoomById);
roomRouter.delete("/:id", isAdmin, deleteRoom);

export default roomRouter;
