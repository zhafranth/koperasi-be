import db from "../../db";

class SimpananSukarela {
  static async getAll() {
    return await db("simpanan_sukarela as ss")
      .leftJoin("r_anggota as a", "ss.id_anggota", "a.id")
      .select(
        "ss.id",
        "ss.id_anggota",
        "a.nama",
        "ss.jumlah",
        "ss.tanggal",
        "ss.keterangan",
        "ss.createdAt"
      )
      .orderBy("ss.createdAt", "desc");
  }

  static async getById(id: number) {
    const data = await db("simpanan_sukarela as ss")
      .leftJoin("r_anggota as a", "ss.id_anggota", "a.id")
      .select(
        "ss.id",
        "ss.id_anggota",
        "a.nama",
        "ss.jumlah",
        "ss.tanggal",
        "ss.keterangan",
        "ss.createdAt"
      )
      .where("ss.id", id)
      .first();

    if (!data) {
      throw new Error("Simpanan sukarela tidak ditemukan");
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
      await trx("simpanan_sukarela").insert({
        id_anggota,
        jumlah: Number(jumlah),
        tanggal: tanggal || new Date(),
        keterangan: keterangan || null,
      });

      await trx("transaksi").insert({
        id_anggota,
        jenis: "sukarela",
        jumlah: Number(jumlah),
        keterangan: keterangan || "Simpanan sukarela",
      });
    });
  }

  static async update(id: number, payload: any) {
    const existing = await db("simpanan_sukarela").where("id", id).first();
    if (!existing) {
      throw new Error("Simpanan sukarela tidak ditemukan");
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

    await db("simpanan_sukarela").where("id", id).update(updateData);
  }

  static async delete(id: number) {
    const existing = await db("simpanan_sukarela").where("id", id).first();
    if (!existing) {
      throw new Error("Simpanan sukarela tidak ditemukan");
    }

    await db("simpanan_sukarela").where("id", id).delete();
  }
}

export default SimpananSukarela;
