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

export const getTransaksiById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const transaksi = await Transaksi.getById(id);
    res.json({
      data: transaksi,
      message: "Success get transaksi detail",
    });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Internal Server Error" });
  }
};

export const deleteTransaksi = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await Transaksi.delete(id);
    res.json({ message: "Transaksi berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Internal Server Error" });
  }
};

export const updateTransaksi = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await Transaksi.update(id, req.body);
    res.json({ message: "Transaksi berhasil diupdate" });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "Internal Server Error" });
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
