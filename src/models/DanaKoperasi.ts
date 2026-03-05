import db from "../../db";

class DanaKoperasi {
  /**
   * Pemasukan: transaksi jenis 'sukarela' dan 'infaq' dengan jumlah positif
   * JOIN r_anggota untuk menampilkan nama (id_anggota NOT NULL)
   */
  static async getPemasukan(query?: { sumber?: string }) {
    const q = db("transaksi as t")
      .join("r_anggota as a", "t.id_anggota", "a.id")
      .whereIn("t.jenis", ["sukarela", "infaq"])
      .where("t.jumlah", ">", 0)
      .select(
        "t.id",
        "t.jenis as sumber",
        "t.jumlah",
        "t.keterangan",
        "t.createdAt",
        "a.nama as nama_anggota"
      )
      .orderBy("t.createdAt", "desc");

    if (query?.sumber) {
      q.where("t.jenis", query.sumber);
    }

    return await q;
  }

  /**
   * Pengeluaran: penarikan dengan sumber 'sukarela' dan 'infaq'
   * Tanpa join (id_anggota bisa NULL untuk dana koperasi)
   */
  static async getPengeluaran(query?: { sumber?: string }) {
    const q = db("penarikan as p")
      .whereIn("p.sumber", ["sukarela", "infaq"])
      .select(
        "p.id",
        "p.sumber",
        "p.jumlah",
        "p.keterangan",
        "p.tanggal",
        "p.tahun"
      )
      .orderBy("p.tanggal", "desc");

    if (query?.sumber) {
      q.where("p.sumber", query.sumber);
    }

    return await q;
  }
}

export default DanaKoperasi;
