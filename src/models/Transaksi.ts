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
        "transaksi.saldo_akhir",
        "r_anggota.nama as nama_anggota",
      )
      .orderBy("createdAt", "desc")
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
    try {
      const total = await db("transaksi")
        .select({
          jumlah_dana: db("transaksi").sum("jumlah"),
          jumlah_pinjaman: db("transaksi")
            .sum("jumlah")
            .where("jenis", "pinjaman"),
          total_dana: db("transaksi")
            .sum("jumlah")
            .where("jenis", "!=", "pinjaman"),
        })
        .first();
      if (!total) {
        return {
          jumlah_dana: 0,
          jumlah_pinjaman: 0,
          total_dana: 0,
        };
      }
      return {
        jumlah_dana: Number(total.jumlah_dana || 0),
        jumlah_pinjaman: Number(total.jumlah_pinjaman || 0),
        total_dana: Number(total.total_dana || 0),
      };
    } catch (error) {
      console.log(error);
    }
  }
}

export default Transaksi;
