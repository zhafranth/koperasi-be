import db from "../../db";

class Pinjaman {
  static async getAll() {
    return await db("pinjaman");
  }

  static async getByUserId(id: number) {
    return await db("pinjaman").where("id_anggota", id);
  }

  static async create(payload: any) {
    try {
      const { id_anggota, jumlah, tanggal, keterangan } = payload;
      const anggota = await db("anggota").where("id", id_anggota).first();

      const totalPinjaman = await db("pinjaman")
        .where("id_anggota", id_anggota)
        .where("status", "disetujui")
        .sum("jumlah as total");

      if (!anggota) {
        throw new Error("User not found");
      }

      if (
        jumlah >
        anggota.saldo_simpanan * 0.8 - (totalPinjaman[0].total || 0)
      ) {
        throw new Error("Saldo pinjaman melebihi saldo anggota");
      }
      const data = {
        id_anggota,
        jumlah,
        tanggal_pengajuan: tanggal,
        tanggal_disetujui: tanggal,
        status: "disetujui",
        keterangan,
      };
      await db("pinjaman").insert(data);
      await db("transaksi").insert({
        id_anggota,
        jenis: "pinjaman",
        jumlah: jumlah * -1,
        tanggal,
        saldo_akhir: anggota.saldo_simpanan,
      });
    } catch (error) {
      throw error;
    }
  }
}

export default Pinjaman;
