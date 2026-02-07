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
      const { id_pinjaman, jumlah } = payload;

      const pinjaman = await db("pinjaman")
        .where("id_pinjaman", id_pinjaman)
        .first();

      const cicilan = await db("cicilan")
        .where("id_pinjaman", id_pinjaman)
        .sum("jumlah as total_cicilan")
        .first();

      if (!pinjaman) {
        throw new Error("Pinjaman tidak tersedia");
      }
      if (jumlah > pinjaman.jumlah - (cicilan?.total_cicilan || 0)) {
        throw new Error("Jumlah cicilan melebihi sisa pinjaman");
      }

      const dataCicilan = {
        id_pinjaman,
        jumlah,
      };

      await db("cicilan").insert(dataCicilan);
      await db("transaksi").insert({
        id_anggota: pinjaman.id_anggota,
        jenis: "cicilan",
        jumlah: jumlah,
      });

      if (
        Number(cicilan?.total_cicilan || 0) + Number(jumlah) ===
        Number(pinjaman.jumlah)
      ) {
        await db("pinjaman")
          .update({ status: "lunas" })
          .where("id_pinjaman", id_pinjaman);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default Cicilan;
