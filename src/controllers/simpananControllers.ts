import { Request, Response } from "express";
import Simpanan from "../models/Simpanan";

export const getAll = async (req: Request, res: Response) => {
  try {
    const simpanan = await Simpanan.getAll();
    res.json({
      data: simpanan,
      message: "Success get all simpanan",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createSimpanan = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await Simpanan.create(payload);

    res.json({
      message: "Success create simpanan",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
