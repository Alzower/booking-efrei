import prisma from "../../db/prisma";

export const createRoom = async (req, res) => {
  try {
    const { name, capacity, equipment } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nom de salle invalide" });
    }

    if (!capacity || capacity <= 0) {
      return res.status(400).json({ error: "Capacité de salle invalide" });
    }

    if (!Array.isArray(equipment)) {
      return res
        .status(400)
        .json({ error: "L'équipement doit être un tableau" });
    }

    if (
      !equipment.every((item) => typeof item === "string" && item.trim() !== "")
    ) {
      return res.status(400).json({
        error:
          "Tous les équipements doivent être des chaînes de caractères non vides",
      });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        capacity,
        equipment,
      },
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création de la salle" });
  }
};
