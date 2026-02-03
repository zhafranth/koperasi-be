import db from "../../db";

class Pinjaman {
  static async getAll({ status = "proses" }: { status?: string }) {
    try {
      const result = await db("pinjaman")
        .join("r_anggota", "pinjaman.id_anggota", "r_anggota.id")
        .select(
          "pinjaman.id",
          "pinjaman.jumlah",
          "pinjaman.keterangan",
          "pinjaman.status",
          "pinjaman.createdAt",
          "r_anggota.nama as nama_anggota",
        )
        .where("pinjaman.status", status);
      if (!result) {
        throw new Error("Pinjaman not found");
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  static async getByUserId(id: number) {
    return await db("pinjaman").where("id_anggota", id);
  }

  static async getById(id: number) {
    try {
      const result = await db("pinjaman as p")
        .join("cicilan as c", "p.id", "c.id_pinjaman")
        .join("r_anggota as a", "p.id_anggota", "a.id")
        .select(
          "p.id",
          "p.keterangan",
          "p.status",
          "p.jumlah",
          "a.nama as nama_anggota",
          "p.tanggal_pengajuan",
          {
            sisa: db.raw("p.jumlah - COALESCE(SUM(c.jumlah), 0)"),
          },
        )
        .where("p.id", id)
        .first();
      if (!result.jumlah) {
        throw new Error("Pinjaman not found");
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
  static async getListCicilan(id: number) {
    return await db("cicilan").where("id_pinjaman", id);
  }

  static async create(payload: any) {
    try {
      const { id_anggota, jumlah, tanggal, keterangan } = payload;
      const anggota = await db("r_anggota").where("id", id_anggota).first();

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
