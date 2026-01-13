import prisma from "../../db/prisma.ts";

export const deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;

    if (!reservationId) {
      return res.status(400).json({ error: "ID de réservation invalide" });
    }

    const existingReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!existingReservation) {
      return res
        .status(404)
        .json({ error: "Réservation non trouvée avec cet ID" });
    }

    if (existingReservation.userId !== userId) {
      return res.status(403).json({
        error: "Vous n'êtes pas autorisé à supprimer cette réservation",
      });
    }

    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    res.status(200).json({ message: "Réservation supprimée avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de la réservation" });
  }
};
