import prisma from "../../db/prisma.ts";

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, equipment } = req.body;

    if (name == "") {
      return res.status(400).json({ error: "Nom de salle invalide" });
    }

    if (capacity !== undefined && capacity !== null && capacity <= 0) {
      return res.status(400).json({ error: "Capacité de salle invalide" });
    }

    const existingRoom = await prisma.room.findUnique({
      where: { id: id },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: "Salle non trouvée" });
    }

    const updatedRoom = await prisma.room.update({
      where: { id: id },
      data: {
        name: name ?? existingRoom.name,
        capacity: capacity ?? existingRoom.capacity,
        equipment: equipment ?? existingRoom.equipment,
      },
    });

    res.status(200).json(updatedRoom);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de la salle" });
  }
};
