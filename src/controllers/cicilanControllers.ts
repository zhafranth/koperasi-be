import { Request, Response } from "express";
import Cicilan from "../models/Cicilan";

export const getAllCicilan = async (req: Request, res: Response) => {
  try {
    const cicilan = await Cicilan.getAll();
    res.json({
      data: cicilan,
      message: "Success get all cicilan",
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};

export const createCicilan = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const cicilan = await Cicilan.create(payload);
    res.json({
      data: cicilan,
      message: "Success create cicilan",
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};
