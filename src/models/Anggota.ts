import db from "../../db";

class Anggota {
  static async getAll({
    nama,
    page = 1,
    limit = 20,
  }: {
    nama?: string;
    page?: number;
    limit?: number;
  }) {
    const offset = (page - 1) * limit;

    const baseQuery = () =>
      db("r_anggota")
        .leftJoin("r_keluarga as k", function () {
          this.on("r_anggota.id_keluarga", "=", "k.id_keluarga");
        })
        .modify((qb) => {
          if (nama?.trim()) {
            qb.where("r_anggota.nama", "like", `%${nama}%`);
          }
        });

    const totalCount = await baseQuery()
      .countDistinct("r_anggota.id as count")
      .first();

    const data = await baseQuery()
      .select(
        "r_anggota.id",
        "r_anggota.nama",
        "r_anggota.status",
        "r_anggota.id_keluarga",
        "k.nama_kepala_keluarga",
        "r_anggota.no_telepon",
        {
          total_simpanan: db.raw(
            "COALESCE((SELECT SUM(s.jumlah) FROM simpanan s WHERE s.id_anggota = r_anggota.id), 0)",
          ),
          // Outstanding active loans: jumlah pinjaman - cicilan paid per pinjaman
          jumlah_pinjaman: db.raw(`
            COALESCE((
              SELECT SUM(p.jumlah - COALESCE((
                SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
              ), 0))
              FROM pinjaman p
              WHERE p.id_anggota = r_anggota.id AND p.status = 'proses'
            ), 0)
          `),
        },
      )
      .offset(offset)
      .limit(limit);

    const total = Number(totalCount?.count || 0);

    return {
      data,
      pagination: {
        total,
        page,
        total_pages: Math.ceil(total / limit),
      },
    };
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
        {
          total_simpanan: db.raw(
            "COALESCE((SELECT SUM(s.jumlah) FROM simpanan s WHERE s.id_anggota = r_anggota.id), 0)",
          ),
        },
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

      const { username, password, id: _id, ...rest } = payload;

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
