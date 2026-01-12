import prisma from "../../db/prisma";
import { reservationDateIsValid } from "../../../helper/reservation-helper";

export const createReservation = async (req, res) => {
  try {
    const { userId, roomId, startTime, endTime } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    if (!roomId) {
      return res.status(400).json({ error: "ID de salle invalide" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!reservationDateIsValid(start, end)) {
      return res.status(400).json({ error: "Plage horaire invalide" });
    }

    const overlappingBookings = await prisma.reservation.findMany({
      where: {
        roomId,
        OR: [
          {
            startTime: {
              lt: end,
            },
            endTime: {
              gt: start,
            },
          },
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return res
        .status(400)
        .json({ error: "La salle est déjà réservée pour cette plage horaire" });
    }

    const booking = await prisma.reservation.create({
      data: {
        userId,
        roomId,
        startTime: start,
        endTime: end,
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création de la réservation" });
  }
};
