import { Request, Response } from "express";
import Penarikan from "../models/Penarikan";

export const getAllPenarikan = async (req: Request, res: Response) => {
  try {
    const { sumber } = req.query;
    const data = await Penarikan.getAll({
      sumber: sumber as string | undefined,
    });
    res.json({
      data,
      message: "Success get all penarikan",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPenarikanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await Penarikan.getById(Number(id));
    res.json({
      data,
      message: "Success get penarikan detail",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const getSaldoPenarikan = async (req: Request, res: Response) => {
  try {
    const { id_anggota, sumber } = req.query;

    if (!sumber) {
      res.status(400).json({ message: "sumber harus diisi" });
      return;
    }

    const sumberKoperasi = ["infaq", "sukarela"];
    if (!sumberKoperasi.includes(sumber as string) && !id_anggota) {
      res.status(400).json({ message: "id_anggota harus diisi untuk sumber ini" });
      return;
    }

    const saldo = await Penarikan.getSaldo(
      sumberKoperasi.includes(sumber as string) ? null : Number(id_anggota),
      sumber as "simpanan" | "sukarela" | "infaq" | "liburan"
    );

    res.json({
      data: { saldo },
      message: "Success get saldo",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const createPenarikan = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await Penarikan.create(payload);
    res.json({
      message: "Success create penarikan",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const deletePenarikan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Penarikan.delete(Number(id));
    res.json({ message: "Success delete penarikan" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
