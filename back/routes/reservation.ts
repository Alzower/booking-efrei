import express from "express";
import { createReservation } from "../controller/reservation/create-reservation";
import { deleteReservation } from "../controller/reservation/delete-reservation";
import {
  getAllReservationsByRoomId,
  getReservationAfterDate,
  getReservationsByUser,
} from "../controller/reservation/get-reservation";
import { isAdmin } from "../middleware/admin";

const reservationRouter = express.Router();

reservationRouter.post("/", createReservation);
reservationRouter.delete("/:reservationId", deleteReservation);
reservationRouter.get("/", getReservationsByUser);
reservationRouter.get("/:date", getReservationAfterDate);
reservationRouter.get("/room/:roomId", isAdmin, getAllReservationsByRoomId);

export default reservationRouter;
