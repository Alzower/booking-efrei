import prisma from "../../db/prisma";
import bcrypt from "bcrypt";
import { isMailValid } from "../../../helper/mail-helper";
import { passwordIsValid } from "../../../helper/password-helper";

export const createUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (!isMailValid(email)) {
      return res.status(400).json({ error: "Adresse email invalide" });
    }

    if (!passwordIsValid(password)) {
      return res.status(400).json({
        error:
          "Mot de passe invalide. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création de l'utilisateur" });
  }
};
