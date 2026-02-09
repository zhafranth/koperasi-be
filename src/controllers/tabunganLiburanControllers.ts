import { Request, Response } from "express";
import TabunganLiburan from "../models/TabunganLiburan";

export const getAllTabunganLiburan = async (req: Request, res: Response) => {
  try {
    const data = await TabunganLiburan.getAll();
    res.json({
      data,
      message: "Success get all tabungan liburan",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTabunganLiburanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await TabunganLiburan.getById(Number(id));
    res.json({
      data,
      message: "Success get tabungan liburan detail",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const createTabunganLiburan = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await TabunganLiburan.create(payload);
    res.json({
      message: "Success create tabungan liburan",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const updateTabunganLiburan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    await TabunganLiburan.update(Number(id), payload);
    res.json({ message: "Success update tabungan liburan" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const deleteTabunganLiburan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await TabunganLiburan.delete(Number(id));
    res.json({ message: "Success delete tabungan liburan" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
