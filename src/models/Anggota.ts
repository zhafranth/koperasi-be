import db from "../../db";

class Anggota {
  static async getAll({ nama }: { nama?: string }) {
    const result = await db("r_anggota")
      .leftJoin("pinjaman as p", function () {
        this.on("r_anggota.id", "=", "p.id_anggota").andOnVal(
          "p.status",
          "=",
          "proses",
        );
      })
      .leftJoin("r_keluarga as k", function () {
        this.on("r_anggota.id_keluarga", "=", "k.id_keluarga");
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
        "r_anggota.id_keluarga",
        "k.nama_kepala_keluarga",
        "r_anggota.no_telepon",
        "r_anggota.saldo_simpanan",
      )
      .sum({ jumlah_pinjaman: db.raw("COALESCE(p.jumlah, 0)") })
      .groupBy(
        "r_anggota.id",
        "r_anggota.nama",
        "r_anggota.status",
        "r_anggota.id_keluarga",
        "k.nama_kepala_keluarga",
        "r_anggota.no_telepon",
        "r_anggota.saldo_simpanan",
      );

    return result;
  }

  static async getDetail(id: number) {
    const result = await db("r_anggota")
      .leftJoin("r_keluarga as k", function () {
        this.on("r_anggota.id_keluarga", "=", "k.id_keluarga");
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
        "r_anggota.id_keluarga",
        "k.nama_kepala_keluarga",
      )
      .where("r_anggota.id", id)
      .first();
    return result;
  }
  static async update(id: number, payload: any) {
    try {
      const anggota = await db("r_anggota").where("id", id).first();
      if (!anggota) {
        throw new Error("Anggota tidak ditemukan");
      }

      const { username, password, saldo_simpanan, id: _id, ...rest } = payload;

      if (rest.id_keluarga) {
        const keluarga = await db("r_keluarga")
          .where("id_keluarga", rest.id_keluarga)
          .first();
        if (!keluarga) {
          throw new Error("Keluarga tidak ditemukan");
        }
      }

      const allowedFields = [
        "nama",
        "nik",
        "alamat",
        "no_telepon",
        "email",
        "id_keluarga",
        "role",
        "status",
      ];

      const cleanPayload: Record<string, any> = {};
      for (const key of allowedFields) {
        if (rest[key] !== undefined) {
          cleanPayload[key] = rest[key];
        }
      }

      if (Object.keys(cleanPayload).length === 0) {
        throw new Error("Tidak ada data yang diubah");
      }

      await db("r_anggota").where("id", id).update(cleanPayload);
    } catch (error) {
      throw error;
    }
  }
}

export default Anggota;
