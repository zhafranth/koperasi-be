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
      .whereNotNull("id_keluarga")
      .select("id", "id_keluarga", "nama", "nik", "no_telepon", "status");

    const anggotaMap = new Map<number, any[]>();
    for (const anggota of anggotaList) {
      const list = anggotaMap.get(anggota.id_keluarga) || [];
      list.push(anggota);
      anggotaMap.set(anggota.id_keluarga, list);
    }

    return keluargaList.map((keluarga) => ({
      ...keluarga,
      anggota: anggotaMap.get(keluarga.id_keluarga) || [],
    }));
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
