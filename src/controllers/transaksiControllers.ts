import { Request, Response } from "express";
import Transaksi from "../models/Transaksi";

export const getAllTransaksi = async (req: Request, res: Response) => {
  try {
    const queryParams = req.query;
    const transaksi = await Transaksi.getAll(queryParams);
    res.json({
      data: transaksi.data,
      pagination: transaksi.pagination,
      message: "Success get all transaksi",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getJumlahTransaksi = async (req: Request, res: Response) => {
  try {
    const total = await Transaksi.getTotalTransaksi();
    res.json({
      data: total,
      message: "Success get total transaksi",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
