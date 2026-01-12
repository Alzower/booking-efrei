import prisma from "../../db/prisma";

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, name, password } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email, name, password },
    });

    res.json(updatedUser);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
  }
};
