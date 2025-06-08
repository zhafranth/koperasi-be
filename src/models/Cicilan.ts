import db from "../../db";

class Cicilan {
  static async getAll() {
    return await db("cicilan");
  }
  static async getByPinjamanId(id: number) {
    const result = await db("cicilan as c").where("c.id_pinjaman", id);
    return result;
  }
  static async create(payload: any) {
    try {
      const { id_pinjaman, jumlah, tanggal, keterangan } = payload;

      const sisaPinjaman = await db("pinjaman")
        .select(
          "id_anggota",
          db.raw(
            `jumlah - COALESCE((
          SELECT SUM(c.jumlah) 
          FROM cicilan c 
          WHERE c.id_pinjaman = pinjaman.id
        ), 0) AS sisa_pinjaman`
          )
        )
        .where("id", id_pinjaman)
        .first();

      const anggota = await db("anggota")
        .where("id", sisaPinjaman.id_anggota)
        .first();
      if (!sisaPinjaman) {
        throw new Error("Pinjaman tidak tersedia");
      }

      if (jumlah > sisaPinjaman.sisa_pinjaman) {
        throw new Error("Jumlah cicilan melebihi sisa pinjaman");
      }

      const dataCicilan = {
        id_pinjaman,
        jumlah,
        tanggal_bayar: tanggal,
        keterangan,
      };

      await db("cicilan").insert(dataCicilan);
      await db("transaksi").insert({
        id_anggota: sisaPinjaman.id_anggota,
        jenis: "cicilan",
        jumlah: jumlah,
        tanggal,
        saldo_akhir: anggota.saldo_simpanan,
      });

      if (sisaPinjaman.sisa_pinjaman - jumlah === 0) {
        await db("pinjaman")
          .update({ status: "lunas" })
          .where("id", id_pinjaman);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default Cicilan;
