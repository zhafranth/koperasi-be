import { Request, Response } from "express";
import SimpananSukarela from "../models/SimpananSukarela";

export const getAllSimpananSukarela = async (req: Request, res: Response) => {
  try {
    const data = await SimpananSukarela.getAll();
    res.json({
      data,
      message: "Success get all simpanan sukarela",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getSimpananSukarelaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await SimpananSukarela.getById(Number(id));
    res.json({
      data,
      message: "Success get simpanan sukarela detail",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const createSimpananSukarela = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await SimpananSukarela.create(payload);
    res.json({
      message: "Success create simpanan sukarela",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const updateSimpananSukarela = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    await SimpananSukarela.update(Number(id), payload);
    res.json({ message: "Success update simpanan sukarela" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const deleteSimpananSukarela = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await SimpananSukarela.delete(Number(id));
    res.json({ message: "Success delete simpanan sukarela" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
