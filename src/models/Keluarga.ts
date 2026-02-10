import db from "../../db";

class Keluarga {
  static async getAll() {
    const keluargaList = await db("r_keluarga")
      .select(
        "id_keluarga",
        "nama_kepala_keluarga",
        "tgl_gabung",
        "created_date",
      )
      .orderBy("created_date", "desc");

    const anggotaList = await db("r_anggota")
      .leftJoin("pinjaman as p", function () {
        this.on("r_anggota.id", "=", "p.id_anggota").andOnVal(
          "p.status",
          "=",
          "proses",
        );
      })
      .whereNotNull("r_anggota.id_keluarga")
      .select(
        "r_anggota.id",
        "r_anggota.id_keluarga",
        "r_anggota.nama",
        "r_anggota.nik",
        "r_anggota.no_telepon",
        "r_anggota.status",
      )
      .sum({ jumlah_pinjaman: db.raw("COALESCE(p.jumlah, 0)") })
      .groupBy(
        "r_anggota.id",
        "r_anggota.id_keluarga",
        "r_anggota.nama",
        "r_anggota.nik",
        "r_anggota.no_telepon",
        "r_anggota.status",
      );

    const anggotaIds = anggotaList.map((a: any) => a.id);

    const [simpananRows, sukarelaRows, liburanRows] = await Promise.all([
      anggotaIds.length > 0
        ? db("simpanan")
            .whereIn("id_anggota", anggotaIds)
            .groupBy("id_anggota")
            .select("id_anggota")
            .sum("jumlah as total")
        : [],
      anggotaIds.length > 0
        ? db("simpanan_sukarela")
            .whereIn("id_anggota", anggotaIds)
            .groupBy("id_anggota")
            .select("id_anggota")
            .sum("jumlah as total")
        : [],
      anggotaIds.length > 0
        ? db("tabungan_liburan")
            .whereIn("id_anggota", anggotaIds)
            .groupBy("id_anggota")
            .select("id_anggota")
            .sum("jumlah as total")
        : [],
    ]);

    const simpananMap = new Map(
      (simpananRows as any[]).map((r) => [r.id_anggota, Number(r.total)]),
    );
    const sukarelaMap = new Map(
      (sukarelaRows as any[]).map((r) => [r.id_anggota, Number(r.total)]),
    );
    const liburanMap = new Map(
      (liburanRows as any[]).map((r) => [r.id_anggota, Number(r.total)]),
    );

    const anggotaMap = new Map<number, any[]>();
    for (const anggota of anggotaList) {
      const a = anggota as any;
      const entry = {
        id: a.id,
        id_keluarga: a.id_keluarga,
        nama: a.nama,
        nik: a.nik,
        no_telepon: a.no_telepon,
        status: a.status,
        total_simpanan: simpananMap.get(a.id) || 0,
        jumlah_pinjaman: Number(a.jumlah_pinjaman) || 0,
        jumlah_sukarela: sukarelaMap.get(a.id) || 0,
        jumlah_tabungan_liburan: liburanMap.get(a.id) || 0,
      };
      const list = anggotaMap.get(a.id_keluarga) || [];
      list.push(entry);
      anggotaMap.set(a.id_keluarga, list);
    }

    return keluargaList.map((keluarga) => {
      const anggota = anggotaMap.get(keluarga.id_keluarga) || [];
      let total_simpanan = 0;
      let total_pinjaman = 0;
      let total_sukarela = 0;
      let total_tabungan_liburan = 0;

      for (const a of anggota) {
        total_simpanan += a.total_simpanan;
        total_pinjaman += a.jumlah_pinjaman;
        total_sukarela += a.jumlah_sukarela;
        total_tabungan_liburan += a.jumlah_tabungan_liburan;
      }

      return {
        ...keluarga,
        total_simpanan,
        total_pinjaman,
        total_sukarela,
        total_tabungan_liburan,
        anggota,
      };
    });
  }

  static async create(payload: any) {
    try {
      const { nama_kepala_keluarga, list_id_anggota } = payload;

      if (!nama_kepala_keluarga?.trim()) {
        throw new Error("Nama kepala keluarga wajib diisi");
      }

      if (!Array.isArray(list_id_anggota) || list_id_anggota.length === 0) {
        throw new Error("List anggota wajib diisi");
      }

      const anggotaRows = await db("r_anggota")
        .whereIn("id", list_id_anggota)
        .select("id", "nama", "id_keluarga");

      if (anggotaRows.length !== list_id_anggota.length) {
        throw new Error("Beberapa anggota tidak ditemukan");
      }

      const sudahPunyaKeluarga = anggotaRows.filter(
        (a) => a.id_keluarga !== null
      );
      if (sudahPunyaKeluarga.length > 0) {
        const names = sudahPunyaKeluarga.map((a) => a.nama).join(", ");
        throw new Error(
          `Anggota berikut sudah terdaftar di keluarga lain: ${names}`
        );
      }

      await db.transaction(async (trx) => {
        const [id_keluarga] = await trx("r_keluarga").insert({
          nama_kepala_keluarga,
        });

        await trx("r_anggota")
          .whereIn("id", list_id_anggota)
          .update({ id_keluarga });
      });
    } catch (error) {
      throw error;
    }
  }
  static async update(id: number, payload: any) {
    try {
      const { nama_kepala_keluarga, list_id_anggota } = payload;

      const keluarga = await db("r_keluarga").where("id_keluarga", id).first();
      if (!keluarga) {
        throw new Error("Keluarga tidak ditemukan");
      }

      await db.transaction(async (trx) => {
        if (nama_kepala_keluarga !== undefined) {
          if (!nama_kepala_keluarga?.trim()) {
            throw new Error("Nama kepala keluarga wajib diisi");
          }
          await trx("r_keluarga")
            .where("id_keluarga", id)
            .update({ nama_kepala_keluarga });
        }

        if (Array.isArray(list_id_anggota)) {
          if (list_id_anggota.length > 0) {
            const anggotaRows = await trx("r_anggota")
              .whereIn("id", list_id_anggota)
              .select("id", "nama", "id_keluarga");

            if (anggotaRows.length !== list_id_anggota.length) {
              throw new Error("Beberapa anggota tidak ditemukan");
            }

            const sudahPunyaKeluargaLain = anggotaRows.filter(
              (a) => a.id_keluarga !== null && a.id_keluarga !== id
            );
            if (sudahPunyaKeluargaLain.length > 0) {
              const names = sudahPunyaKeluargaLain
                .map((a) => a.nama)
                .join(", ");
              throw new Error(
                `Anggota berikut sudah terdaftar di keluarga lain: ${names}`
              );
            }
          }

          // Lepas semua anggota lama dari keluarga ini
          await trx("r_anggota")
            .where("id_keluarga", id)
            .update({ id_keluarga: null });

          // Set anggota baru
          if (list_id_anggota.length > 0) {
            await trx("r_anggota")
              .whereIn("id", list_id_anggota)
              .update({ id_keluarga: id });
          }
        }
      });
    } catch (error) {
      throw error;
    }
  }

  static async delete(id: number) {
    try {
      const keluarga = await db("r_keluarga").where("id_keluarga", id).first();
      if (!keluarga) {
        throw new Error("Keluarga tidak ditemukan");
      }

      await db.transaction(async (trx) => {
        // Lepas semua anggota dari keluarga ini
        await trx("r_anggota")
          .where("id_keluarga", id)
          .update({ id_keluarga: null });

        await trx("r_keluarga").where("id_keluarga", id).del();
      });
    } catch (error) {
      throw error;
    }
  }

  static async getListAnggota(id: number) {
    return await db("r_anggota")
      .where("id_keluarga", id)
      .select("id", "id_keluarga", "nama", "nik", "no_telepon", "status");
  }
}

export default Keluarga;
