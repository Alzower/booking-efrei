import prisma from "../../db/prisma";
import bcrypt from "bcrypt";
import { findUserByEmail } from "../../helper/user-helper";

export const loginController = async (req, res) => {
  const jwt = require("jsonwebtoken");

  const { email, password } = req.body;

  const user = await findUserByEmail(prisma, email);

  if (!user) return res.status(404).send("user not found");

  const checkPasswordValid = await bcrypt.compare(password, user.password);

  if (!checkPasswordValid) return res.status(400).send("invalid password");

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({ token });
};
