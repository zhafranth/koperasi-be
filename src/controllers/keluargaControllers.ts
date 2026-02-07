import { Request, Response } from "express";
import Keluarga from "../models/Keluarga";

export const getAllKeluarga = async (req: Request, res: Response) => {
  try {
    const keluarga = await Keluarga.getAll();
    res.json({
      data: keluarga,
      message: "Success get all keluarga",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createKeluarga = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await Keluarga.create(payload);
    res.json({
      message: "Success create keluarga",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const updateKeluarga = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    await Keluarga.update(Number(id), payload);
    res.json({ message: "Success update keluarga" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const deleteKeluarga = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Keluarga.delete(Number(id));
    res.json({ message: "Success delete keluarga" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
