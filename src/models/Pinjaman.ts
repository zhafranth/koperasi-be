import db from "../../db";

class Pinjaman {
  static async getAll({ status }: { status?: string }) {
    try {
      const result = await db("pinjaman")
        .join("r_anggota", "pinjaman.id_anggota", "r_anggota.id")
        .select(
          "pinjaman.id_pinjaman",
          "pinjaman.jumlah",
          "pinjaman.keterangan",
          "pinjaman.status",
          "pinjaman.createdAt",
          "r_anggota.nama as nama_anggota",
        )
        .where("pinjaman.status", status);
      if (!result) {
        throw new Error("Pinjaman not found");
      }
      return result;
    } catch (error) {
      console.log(error);
    }
  }

  static async getByUserId(id: number) {
    return await db("pinjaman").where("id_anggota", id);
  }

  static async getById(id: number) {
    try {
      const result = await db("pinjaman as p")
        .join("cicilan as c", "p.id_pinjaman", "c.id_pinjaman")
        .join("r_anggota as a", "p.id_anggota", "a.id")
        .select(
          "p.id_pinjaman",
          "p.keterangan",
          "p.status",
          "p.jumlah",
          "p.createdAt",
          "a.nama as nama_anggota",
          {
            sisa: db.raw("p.jumlah - COALESCE(SUM(c.jumlah), 0)"),
          },
        )
        .where("p.id_pinjaman", id)
        .first();
      if (!result.jumlah) {
        throw new Error("Pinjaman not found");
      }
      return result;
    } catch (error) {
      throw error;
    }
  }
  static async getListCicilan(id: number) {
    return await db("cicilan").where("id_pinjaman", id);
  }

  static async getLimitKeluarga(idAnggota: number) {
    const anggota = await db("r_anggota").where("id", idAnggota).first();
    if (!anggota) {
      throw new Error("Anggota tidak ditemukan");
    }

    if (!anggota.id_keluarga) {
      throw new Error("Anggota belum terdaftar dalam keluarga");
    }

    // Ambil ID seluruh anggota keluarga
    const anggotaKeluarga = await db("r_anggota")
      .where("id_keluarga", anggota.id_keluarga)
      .select("id");
    const anggotaIds = anggotaKeluarga.map((a: any) => a.id);

    // Total simpanan wajib seluruh anggota keluarga (dari table simpanan)
    const totalSimpananKeluarga = await db("simpanan")
      .whereIn("id_anggota", anggotaIds)
      .sum("jumlah as total")
      .first();

    const simpananKeluarga = Number(totalSimpananKeluarga?.total || 0);
    const maxPinjaman = Math.floor(simpananKeluarga * 0.8);

    const totalPinjamanAktif = await db("pinjaman")
      .whereIn("id_anggota", anggotaIds)
      .where("status", "proses")
      .sum("jumlah as total")
      .first();

    const pinjamanAktif = Number(totalPinjamanAktif?.total || 0);
    const sisaLimit = maxPinjaman - pinjamanAktif;

    return {
      simpanan_keluarga: simpananKeluarga,
      max_pinjaman: maxPinjaman,
      pinjaman_aktif: pinjamanAktif,
      sisa_limit: Math.max(sisaLimit, 0),
    };
  }

  static async create(payload: any) {
    try {
      const { id_anggota, jumlah, keterangan } = payload;
      const anggota = await db("r_anggota").where("id", id_anggota).first();

      if (!anggota) {
        throw new Error("Anggota tidak ditemukan");
      }

      if (!anggota.id_keluarga) {
        throw new Error("Anggota belum terdaftar dalam keluarga");
      }

      // Validasi limit pinjaman keluarga (80% simpanan wajib)
      const limit = await this.getLimitKeluarga(id_anggota);

      if (Number(jumlah) > limit.sisa_limit) {
        throw new Error(
          `Jumlah pinjaman melebihi limit keluarga. Sisa limit: ${limit.sisa_limit} (80% simpanan keluarga: ${limit.max_pinjaman}, pinjaman aktif: ${limit.pinjaman_aktif})`,
        );
      }

      const data = {
        id_anggota,
        jumlah,
        status: "proses",
        keterangan,
      };
      await db.transaction(async (trx) => {
        await trx("pinjaman").insert(data);
        await trx("transaksi").insert({
          id_anggota,
          jenis: "pinjaman",
          jumlah: jumlah * -1,
        });
      });
    } catch (error) {
      throw error;
    }
  }
  static async getTotalPinjaman(id: number) {
    return await db("pinjaman")
      .where("id_anggota", id)
      .where("status", "proses")
      .sum("jumlah as total")
      .first();
  }
}

export default Pinjaman;
