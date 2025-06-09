import { Request, Response } from "express";
import Pinjaman from "../models/Pinjaman";
import Cicilan from "../models/Cicilan";

export const getAllPinjaman = async (req: Request, res: Response) => {
  try {
    const querParams = req.query;
    const pinjaman = await Pinjaman.getAll(querParams);
    res.json({
      data: pinjaman,
      message: "Success get all pinjaman",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDetailPinjaman = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pinjaman = await Pinjaman.getById(Number(id));
    const cicilan = await Cicilan.getByPinjamanId(Number(id));
    const { sisa, ...restPinjaman } = pinjaman ?? {};
    res.json({
      data: {
        ...restPinjaman,
        sisa: Number(sisa),
        cicilan,
      },
      message: "Success get detail pinjaman",
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message });
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
