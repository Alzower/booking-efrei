import prisma from "../../db/prisma.ts";

export const getRooms = async (req, res) => {
  try {
    const rooms = await prisma.room.findMany();
    res.status(200).json(rooms);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des salles" });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id: id },
    });

    if (!room) {
      return res.status(404).json({ error: "Salle non trouvée" });
    }

    res.status(200).json(room);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la salle" });
  }
};

export const getRoomAvailableByIdAndDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "La date est requise" });
    }

    const room = await prisma.room.findUnique({
      where: { id: id },
    });
    if (!room) {
      return res.status(404).json({ error: "Salle non trouvée" });
    }

    const targetDate = new Date(date as string);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const reservations = await prisma.reservation.findMany({
      where: {
        roomId: id,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (reservations.length === 0) {
      return res.status(200).json({
        message: "La salle est disponible toute la journée",
        availableTimes: [
          {
            startTime: startOfDay,
            endTime: endOfDay,
          },
        ],
      });
    }

    const availableTimes = [];
    const dayStart = new Date(startOfDay);
    const dayEnd = new Date(endOfDay);

    if (reservations[0].startTime > dayStart) {
      availableTimes.push({
        startTime: dayStart,
        endTime: reservations[0].startTime,
      });
    }

    for (let i = 0; i < reservations.length - 1; i++) {
      const currentEndTime = reservations[i].endTime;
      const nextStartTime = reservations[i + 1].startTime;

      if (currentEndTime < nextStartTime) {
        availableTimes.push({
          startTime: currentEndTime,
          endTime: nextStartTime,
        });
      }
    }

    const lastReservation = reservations[reservations.length - 1];
    if (lastReservation.endTime < dayEnd) {
      availableTimes.push({
        startTime: lastReservation.endTime,
        endTime: dayEnd,
      });
    }

    res.status(200).json({
      availableTimes,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de la salle" });
  }
};
