import prisma from "../../db/prisma";

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRoom = await prisma.room.findUnique({
      where: { id: id },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: "Salle non trouvée" });
    }

    await prisma.room.delete({
      where: { id: id },
    });

    res.status(200).json({ message: "Salle supprimée avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la salle" });
  }
};
