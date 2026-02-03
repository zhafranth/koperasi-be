import db from "../../db";

class Anggota {
  static async getAll({ nama }: { nama?: string }) {
    const result = await db("r_anggota")
      .leftJoin("pinjaman as p", function () {
        this.on("r_anggota.id", "=", "p.id_anggota").andOnVal(
          "p.status",
          "=",
          "disetujui",
        );
      })
      .modify((qb) => {
        if (nama?.trim()) {
          qb.where("r_anggota.nama", "like", `%${nama}%`);
        }
      })
      .select(
        "r_anggota.id",
        "r_anggota.nama",
        "r_anggota.status",
        "r_anggota.no_telepon",
        "r_anggota.saldo_simpanan",
      )
      .sum({ jumlah_pinjaman: db.raw("COALESCE(p.jumlah, 0)") })
      .groupBy(
        "r_anggota.id",
        "r_anggota.nama",
        "r_anggota.status",
        "r_anggota.no_telepon",
        "r_anggota.saldo_simpanan",
      );

    return result;
  }

  static async getDetail(id: number) {
    const result = await db("r_anggota")
      .leftJoin("pinjaman as p", function () {
        this.on("r_anggota.id", "=", "p.id_anggota").andOnVal(
          "p.status",
          "=",
          "disetujui",
        );
      })
      .select(
        "r_anggota.id",
        "r_anggota.nama",
        "r_anggota.nik",
        "r_anggota.alamat",
        "r_anggota.no_telepon",
        "r_anggota.email",
        "r_anggota.tgl_gabung",
        "r_anggota.status",
        "r_anggota.saldo_simpanan",
        "r_anggota.username",
      )
      .sum({ jumlah_pinjaman: db.raw("COALESCE(p.jumlah, 0)") })
      .where("r_anggota.id", id)
      .first();
    return result;
  }
}

export default Anggota;
