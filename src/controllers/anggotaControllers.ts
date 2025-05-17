import Anggota from "../models/Anggota";
import { Request, Response } from "express";
import Simpanan from "../models/Simpanan";
import Pinjaman from "../models/Pinjaman";

export const getAllAnggota = async (req: Request, res: Response) => {
  try {
    const queryParams = req.query;
    const anggota = await Anggota.getAll(queryParams);
    res.json({
      data: anggota.map((item) => ({
        ...item,
        jumlah_pinjaman: Number(item.jumlah_pinjaman),
      })),
      message: "Success get all anggota",
    });
  } catch (error) {
    console.info(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDetailAnggota = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const anggota = await Anggota.getDetail(Number(id));
    const simpanan = await Simpanan.getByUserId(Number(id));
    const pinjaman = await Pinjaman.getByUserId(Number(id));

    res.json({
      data: {
        ...anggota,
        jumlah_pinjaman: Number(anggota?.jumlah_pinjaman),
        simpanan,
        pinjaman,
      },
      message: "Success get detail anggota",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
