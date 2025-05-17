import db from "../../db";

class Simpanan {
  static async getAll() {
    return await db("simpanan");
  }

  static async getByUserId(id: number) {
    return await db("simpanan").where("id_anggota", id);
  }

  static async create(payload: any) {
    try {
      const { id_jenis, jumlah, id_anggota, tanggal } = payload;
      const anggota = await db("anggota").where("id", id_anggota).first();
      const jenisSimpanan = await db("jenis_simpanan")
        .where("id", id_jenis)
        .first();

      if (!anggota) {
        throw new Error("Aggota not found");
      }
      if (!jenisSimpanan) {
        throw new Error("Jenis simpanan not found");
      }

      if (jenisSimpanan.minimal_amount > jumlah) {
        throw new Error("Jumlah simpanan tidak memenuhi minimal amount");
      }

      const dataTransaksi = {
        id_anggota,
        jenis: "simpanan",
        jumlah,
        tanggal,
        saldo_akhir: anggota.saldo_simpanan + jumlah,
      };

      await db("simpanan").insert(payload);
      await db("anggota")
        .increment("saldo_simpanan", jumlah)
        .where("id", id_anggota);
      await db("transaksi").insert(dataTransaksi);
    } catch (error) {
      throw error; // Rethrow the error for handling in the calling code
    }
  }
}

export default Simpanan;
