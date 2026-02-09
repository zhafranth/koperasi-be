import db from "../../db";

class Transaksi {
  static async getAll({
    page = 1,
    limit = 10,
    jenis,
  }: {
    page?: number;
    limit?: number;
    jenis?: string;
  }) {
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db("transaksi")
      .join("r_anggota", "transaksi.id_anggota", "r_anggota.id")
      .modify((qb) => {
        if (jenis) {
          qb.where("jenis", jenis);
        }
      })
      .count("transaksi.id as count")
      .first();

    // Get paginated data
    const data = await db("transaksi")
      .join("r_anggota", "transaksi.id_anggota", "r_anggota.id")
      .modify((qb) => {
        if (jenis) {
          qb.where("jenis", jenis);
        }
      })
      .select(
        "transaksi.id",
        "transaksi.jenis",
        "transaksi.jumlah",
        "transaksi.createdAt",
        "r_anggota.nama as nama_anggota",
      )
      .orderBy("transaksi.createdAt", "desc")
      .offset(offset)
      .limit(limit);

    return {
      data,
      pagination: {
        total: Number(totalCount?.count || 0),
        page,
        total_pages: Math.ceil(Number(totalCount?.count || 0) / limit),
      },
    };
  }
  static async getTotalTransaksi() {
    const [simpanan, infaqMasuk, sukarela, cicilan, liburan, pinjaman, penarikan, anggotaCount] =
      await Promise.all([
        db("simpanan").sum("jumlah as total").first(),
        db("infaq").where("jenis", "masuk").sum("jumlah as total").first(),
        db("simpanan_sukarela").sum("jumlah as total").first(),
        db("cicilan").sum("jumlah as total").first(),
        db("tabungan_liburan").sum("jumlah as total").first(),
        db("pinjaman").where("status", "proses").sum("jumlah as total").first(),
        db("penarikan").sum("jumlah as total").first(),
        db("r_anggota").count("id as total").first(),
      ]);

    const jumlahDana =
      Number(simpanan?.total || 0) +
      Number(infaqMasuk?.total || 0) +
      Number(sukarela?.total || 0) +
      Number(cicilan?.total || 0) +
      Number(liburan?.total || 0);

    return {
      total_anggota: Number(anggotaCount?.total || 0),
      jumlah_dana: jumlahDana,
      jumlah_pinjaman: Number(pinjaman?.total || 0),
      jumlah_simpanan_sukarela: Number(sukarela?.total || 0),
      jumlah_tabungan_liburan: Number(liburan?.total || 0),
      total_dana: jumlahDana - Number(penarikan?.total || 0),
    };
  }
}

export default Transaksi;
