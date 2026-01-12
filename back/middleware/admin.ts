import jwt from "jsonwebtoken";
import { getUser } from "../controller/user/get-user";
import prisma from "../db/prisma";

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.headers.authorization.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Format du token invalide. Utilisez 'Bearer <token>'" });
    }

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;

    const idUser = decoded.id;
    const user = await prisma.user.findUnique({
      where: { id: idUser },
    });

    if (user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès interdit - Admin requis" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide" });
  }
};
