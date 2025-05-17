import db from "../../db";

class Anggota {
  static async getAll({ nama }: { nama?: string }) {
    const result = await db("anggota")
      .leftJoin("pinjaman as p", function () {
        this.on("anggota.id", "=", "p.id_anggota").andOnVal(
          "p.status",
          "=",
          "disetujui"
        );
      })
      .modify((qb) => {
        if (nama?.trim()) {
          qb.where("anggota.nama", "like", `%${nama}%`);
        }
      })
      .select(
        "anggota.id",
        "anggota.nama",
        "anggota.status",
        "anggota.no_telepon",
        "anggota.saldo_simpanan"
      )
      .sum({ jumlah_pinjaman: db.raw("COALESCE(p.jumlah, 0)") })
      .groupBy(
        "anggota.id",
        "anggota.nama",
        "anggota.status",
        "anggota.no_telepon",
        "anggota.saldo_simpanan"
      );

    return result;
  }

  static async getDetail(id: number) {
    const result = await db("anggota")
      .leftJoin("pinjaman as p", function () {
        this.on("anggota.id", "=", "p.id_anggota").andOnVal(
          "p.status",
          "=",
          "disetujui"
        );
      })
      .select(
        "anggota.id",
        "anggota.nama",
        "anggota.nik",
        "anggota.alamat",
        "anggota.no_telepon",
        "anggota.email",
        "anggota.tanggal_bergabung",
        "anggota.status",
        "anggota.saldo_simpanan",
        "anggota.username"
      )
      .sum({ jumlah_pinjaman: db.raw("COALESCE(p.jumlah, 0)") })
      .where("anggota.id", id)
      .first();
    return result;
  }
}

export default Anggota;
