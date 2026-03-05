import { Request, Response } from "express";
import DanaKoperasi from "../models/DanaKoperasi";

export const getPemasukan = async (req: Request, res: Response) => {
  try {
    const { sumber } = req.query;
    const data = await DanaKoperasi.getPemasukan({
      sumber: sumber as string | undefined,
    });
    res.json({
      data,
      message: "Success get pemasukan",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const getPengeluaran = async (req: Request, res: Response) => {
  try {
    const { sumber } = req.query;
    const data = await DanaKoperasi.getPengeluaran({
      sumber: sumber as string | undefined,
    });
    res.json({
      data,
      message: "Success get pengeluaran",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
