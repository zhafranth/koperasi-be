import Anggota from "../models/Anggota";
import { Request, Response } from "express";
import Simpanan from "../models/Simpanan";
import Pinjaman from "../models/Pinjaman";
import Keluarga from "../models/Keluarga";

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

export const updateAnggota = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    await Anggota.update(Number(id), payload);
    res.json({ message: "Success update anggota" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};

export const getDetailAnggota = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [anggota, simpanan, pinjaman, jumlahSimpanan, jumlahPinjaman] =
      await Promise.all([
        Anggota.getDetail(Number(id)),
        Simpanan.getByUserId(Number(id)),
        Pinjaman.getByUserId(Number(id)),
        Simpanan.getTotalSimpanan(Number(id)),
        Pinjaman.getTotalPinjaman(Number(id)),
      ]);

    if (!anggota) {
      res.status(404).json({ message: "Anggota tidak ditemukan" });
    }

    let anggotaKeluarga: any[] = [];
    if (anggota?.id_keluarga) {
      anggotaKeluarga = await Keluarga.getListAnggota(anggota?.id_keluarga);
    }

    res.json({
      data: {
        ...anggota,
        jumlah_simpanan: Number(jumlahSimpanan?.total || 0),
        jumlah_pinjaman: Number(jumlahPinjaman?.total || 0),
        anggota_keluarga: anggotaKeluarga || [],
        simpanan,
        pinjaman,
      },
      message: "Success get detail anggota",
    });
  } catch (error: any) {
    res
      .status(error?.status || 500)
      .json({ message: error?.message || "Internal Server Error" });
  }
};
