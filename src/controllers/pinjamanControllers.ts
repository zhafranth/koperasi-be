import { Request, Response } from "express";
import Pinjaman from "../models/Pinjaman";

export const getAllPinjaman = async (req: Request, res: Response) => {
  try {
    const pinjaman = await Pinjaman.getAll();
    res.json({
      data: pinjaman,
      message: "Success get all pinjaman",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createPinjaman = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await Pinjaman.create(payload);
    res.json({
      message: "Success create pinjaman",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
