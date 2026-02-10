import db from "../../db";

class TabunganLiburan {
  static async getAll() {
    return await db("tabungan_liburan as tl")
      .leftJoin("r_anggota as a", "tl.id_anggota", "a.id")
      .select(
        "tl.id",
        "tl.id_anggota",
        "a.nama",
        "tl.jumlah",
        "tl.tanggal",
        "tl.keterangan",
        "tl.createdAt"
      )
      .orderBy("tl.createdAt", "desc");
  }

  static async getById(id: number) {
    const data = await db("tabungan_liburan as tl")
      .leftJoin("r_anggota as a", "tl.id_anggota", "a.id")
      .select(
        "tl.id",
        "tl.id_anggota",
        "a.nama",
        "tl.jumlah",
        "tl.tanggal",
        "tl.keterangan",
        "tl.createdAt"
      )
      .where("tl.id", id)
      .first();

    if (!data) {
      throw new Error("Tabungan liburan tidak ditemukan");
    }

    return data;
  }

  static async create(payload: any) {
    const { id_anggota, jumlah, tanggal, keterangan } = payload;

    if (!id_anggota) {
      throw new Error("Anggota harus dipilih");
    }

    if (!jumlah || Number(jumlah) <= 0) {
      throw new Error("Jumlah tidak valid");
    }

    const anggota = await db("r_anggota").where("id", id_anggota).first();
    if (!anggota) {
      throw new Error("Anggota tidak ditemukan");
    }

    await db.transaction(async (trx) => {
      await trx("tabungan_liburan").insert({
        id_anggota,
        jumlah: Number(jumlah),
        tanggal: tanggal || new Date(),
        keterangan: keterangan || null,
      });

      await trx("transaksi").insert({
        id_anggota,
        jenis: "liburan",
        jumlah: Number(jumlah),
        keterangan: keterangan || "Tabungan liburan",
      });
    });
  }

  static async update(id: number, payload: any) {
    const existing = await db("tabungan_liburan").where("id", id).first();
    if (!existing) {
      throw new Error("Tabungan liburan tidak ditemukan");
    }

    const allowedFields = ["jumlah", "tanggal", "keterangan"];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (payload[field] !== undefined) {
        updateData[field] = payload[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("Tidak ada data yang diupdate");
    }

    await db("tabungan_liburan").where("id", id).update(updateData);
  }

  static async delete(id: number) {
    const existing = await db("tabungan_liburan").where("id", id).first();
    if (!existing) {
      throw new Error("Tabungan liburan tidak ditemukan");
    }

    await db("tabungan_liburan").where("id", id).delete();
  }
}

export default TabunganLiburan;
