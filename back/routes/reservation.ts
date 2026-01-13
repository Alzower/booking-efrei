import express from "express";
import { createReservation } from "../controller/reservation/create-reservation.ts";
import { deleteReservation } from "../controller/reservation/delete-reservation.ts";
import {
  getAllReservationsByRoomId,
  getReservationAfterDate,
  getReservationsByUser,
} from "../controller/reservation/get-reservation.ts";
import { isAdmin } from "../middleware/admin.ts";

const reservationRouter = express.Router();

reservationRouter.post("/", createReservation);
reservationRouter.delete("/:reservationId", deleteReservation);
reservationRouter.get("/", getReservationsByUser);
reservationRouter.get("/:date", getReservationAfterDate);
reservationRouter.get("/room/:roomId", isAdmin, getAllReservationsByRoomId);

export default reservationRouter;
