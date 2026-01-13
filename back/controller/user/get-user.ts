import prisma from "../../db/prisma";

export const getUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'utilisateur" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des utilisateurs" });
  }
};
