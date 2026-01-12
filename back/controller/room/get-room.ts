import prisma from "../../db/prisma";

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
