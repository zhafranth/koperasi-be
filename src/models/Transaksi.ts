import db from "../../db";

class Transaksi {
  static async getAll() {
    return await db("transaksi")
      .join("anggota", "transaksi.id_anggota", "anggota.id")
      .select(
        "transaksi.id",
        "transaksi.jenis",
        "transaksi.jumlah",
        "transaksi.tanggal",
        "transaksi.saldo_akhir",
        "anggota.nama as nama_anggota"
      )
      .orderBy("tanggal", "desc");
  }
}

export default Transaksi;
