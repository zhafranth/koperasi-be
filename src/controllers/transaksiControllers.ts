import { Request, Response } from "express";
import Transaksi from "../models/Transaksi";

export const getAllTransaksi = async (req: Request, res: Response) => {
  try {
    const transaksi = await Transaksi.getAll();
    res.json({
      data: transaksi,
      message: "Success get all transaksi",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
