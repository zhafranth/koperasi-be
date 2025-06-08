import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../../db";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, ...restPayload } = req.body;
    const existingAnggota = await db("anggota")
      .where("username", username)
      .first();

    if (existingAnggota) {
      res.json({ message: "Username already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    await db("anggota").insert({
      username,
      password: hashedPassword,
      ...restPayload,
    });
    res.json({ message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Check if the username exists
    const anggota = await db("anggota").where("username", username).first();

    if (!anggota) {
      res.status(401).json({ message: "Invalid username" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, anggota.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: anggota.id, username: anggota.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
