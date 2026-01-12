import prisma from "../../db/prisma";

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    res.json(deletedUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
};
