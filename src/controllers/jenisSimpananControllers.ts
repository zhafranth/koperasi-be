import { Request, Response } from "express";
import JenisSimpanan from "../models/JenisSimpanan";

export const getAllJenisSimpanan = async (req: Request, res: Response) => {
  try {
    const jenisSimpanan = await JenisSimpanan.getAll();
    res.json({
      data: jenisSimpanan?.map((item) => ({
        ...item,
        is_wajib: !!item.is_wajib,
        minimal_amount: Math.floor(parseFloat(item.minimal_amount)),
      })),
      message: "Success get all jenis simpanan",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createJenisSimpanan = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await JenisSimpanan.create(payload);
    res.json({
      message: "Success create jenis simpanan",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
