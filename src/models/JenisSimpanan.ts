import db from "../../db";

class JenisSimpanan {
  static async getAll() {
    return await db("r_jenis_simpanan");
  }

  static async create({
    nama,
    minimal_amount,
    is_wajib,
    deskripsi,
  }: {
    nama: string;
    minimal_amount: number;
    is_wajib: boolean;
    deskripsi: string;
  }) {
    await db("r_jenis_simpanan").insert({
      nama_simpanan: nama,
      minimal_amount,
      is_wajib,
      deskripsi,
    });
  }
}

export default JenisSimpanan;
