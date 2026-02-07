import { Request, Response } from "express";
import Infaq from "../models/Infaq";

export const getAllInfaq = async (req: Request, res: Response) => {
  try {
    const infaq = await Infaq.getAll();
    res.json({
      data: infaq,
      message: "Success get all infaq",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createInfaq = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    await Infaq.create(payload);
    res.json({
      message: "Success create infaq",
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
