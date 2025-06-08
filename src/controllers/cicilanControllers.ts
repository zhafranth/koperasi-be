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

export const getCicilanByPinjamanId = async (req: Request, res: Response) => {
  try {
    const { id_pinjaman } = req.params;
    const cicilan = await Cicilan.getByPinjamanId(parseInt(id_pinjaman));
    res.json({
      data: cicilan,
      message: "Success get cicilan by pinjaman id",
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
  }
};
