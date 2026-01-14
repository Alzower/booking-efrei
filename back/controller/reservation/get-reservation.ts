import prisma from "../../db/prisma";

export const getReservationsByUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: userId },
    });

    res.status(200).json(reservations);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations" });
  }
};

export const getReservationAfterDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Date invalide" });
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        userId: userId,
        startTime: {
          gte: parsedDate,
        },
      },
    });

    res.status(200).json(reservations);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations" });
  }
};

export const getAllReservationsByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ error: "ID de salle invalide" });
    }

    const reservations = await prisma.reservation.findMany({
      where: { roomId: roomId },
    });

    res.status(200).json(reservations);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations" });
  }
};

export const getAllReservations = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "ID utilisateur invalide" });
    }

    const reservations = await prisma.reservation.findMany();

    res.status(200).json(reservations);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des réservations" });
  }
};
