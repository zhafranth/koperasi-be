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
    return await db("pinjaman as p")
      .where("p.id_anggota", id)
      .select(
        "p.id_pinjaman as id",
        "p.id_pinjaman",
        "p.id_anggota",
        "p.jumlah",
        "p.createdAt",
        "p.status",
        "p.keterangan",
        {
          sisa: db.raw(`
            p.jumlah - COALESCE((
              SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
            ), 0)
          `),
        },
      )
      .orderBy("p.createdAt", "desc");
  }

  static async getById(id: number) {
    try {
      const result = await db("pinjaman as p")
        .leftJoin("cicilan as c", "p.id_pinjaman", "c.id_pinjaman")
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
        .groupBy(
          "p.id_pinjaman",
          "p.keterangan",
          "p.status",
          "p.jumlah",
          "p.createdAt",
          "a.nama",
        )
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
      // const limit = await this.getLimitKeluarga(id_anggota);

      // if (Number(jumlah) > limit.sisa_limit) {
      //   throw new Error(
      //     `Jumlah pinjaman melebihi limit keluarga. Sisa limit: ${limit.sisa_limit} (80% simpanan keluarga: ${limit.max_pinjaman}, pinjaman aktif: ${limit.pinjaman_aktif})`,
      //   );
      // }

      const data = {
        id_anggota,
        jumlah,
        status: "proses",
        keterangan,
      };
      await db.transaction(async (trx) => {
        const [idPinjaman] = await trx("pinjaman").insert(data);
        const [idTransaksi] = await trx("transaksi").insert({
          id_anggota,
          jenis: "pinjaman",
          jumlah: jumlah * -1,
          keterangan,
        });
        await trx("pinjaman")
          .where("id_pinjaman", idPinjaman)
          .update({ id_transaksi: idTransaksi });
      });
    } catch (error) {
      throw error;
    }
  }
  // Aggregated list per anggota: 1 row per anggota that has at least 1 pinjaman.
  // Status is derived: "proses" if any active loan, otherwise "lunas".
  static async getAggregated({ status }: { status?: string }) {
    const rows = await db("pinjaman as p")
      .join("r_anggota as a", "p.id_anggota", "a.id")
      .select(
        "a.id as id_anggota",
        "a.nama as nama_anggota",
        db.raw("SUM(p.jumlah) as total_pinjaman"),
        db.raw(`SUM(p.jumlah - COALESCE((
          SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
        ), 0)) as total_sisa`),
        db.raw(`SUM(COALESCE((
          SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
        ), 0)) as total_cicilan`),
        db.raw(`SUM(CASE WHEN p.status = 'proses' THEN 1 ELSE 0 END) as count_aktif`),
        db.raw(`SUM(CASE WHEN p.status = 'lunas' THEN 1 ELSE 0 END) as count_lunas`),
        db.raw("MAX(p.createdAt) as last_createdAt"),
      )
      .groupBy("a.id", "a.nama")
      .orderBy("last_createdAt", "desc");

    const mapped = (rows as any[]).map((r) => ({
      id_anggota: r.id_anggota,
      nama_anggota: r.nama_anggota,
      total_pinjaman: Number(r.total_pinjaman),
      total_sisa: Number(r.total_sisa),
      total_cicilan: Number(r.total_cicilan),
      count_aktif: Number(r.count_aktif),
      count_lunas: Number(r.count_lunas),
      status: Number(r.count_aktif) > 0 ? "proses" : "lunas",
      last_createdAt: r.last_createdAt,
    }));

    if (status === "proses") return mapped.filter((r) => r.status === "proses");
    if (status === "lunas") return mapped.filter((r) => r.status === "lunas");
    return mapped;
  }

  // Aggregated detail per anggota: rolled-up totals + per-pinjaman breakdown
  // (for expandable UI) and a flat cicilan history across all of their loans.
  static async getAggregatedByAnggota(idAnggota: number) {
    const anggota = await db("r_anggota")
      .where("id", idAnggota)
      .select("id", "nama")
      .first();
    if (!anggota) throw new Error("Anggota tidak ditemukan");

    const pinjaman = await db("pinjaman as p")
      .where("p.id_anggota", idAnggota)
      .select(
        "p.id_pinjaman",
        "p.jumlah",
        "p.status",
        "p.createdAt",
        "p.keterangan",
        {
          sisa: db.raw(`p.jumlah - COALESCE((
            SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
          ), 0)`),
          cicilan_paid: db.raw(`COALESCE((
            SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
          ), 0)`),
        },
      )
      .orderBy("p.createdAt", "asc");

    const cicilan = await db("cicilan as c")
      .join("pinjaman as p", "c.id_pinjaman", "p.id_pinjaman")
      .where("p.id_anggota", idAnggota)
      .select(
        "c.id_cicilan as id",
        "c.id_pinjaman",
        "c.jumlah",
        "c.createdAt",
        "p.keterangan as pinjaman_keterangan",
      )
      .orderBy("c.createdAt", "desc");

    const total_pinjaman = (pinjaman as any[]).reduce(
      (s, p) => s + Number(p.jumlah),
      0,
    );
    const total_sisa = (pinjaman as any[]).reduce(
      (s, p) => s + Number(p.sisa),
      0,
    );
    const total_cicilan = (pinjaman as any[]).reduce(
      (s, p) => s + Number(p.cicilan_paid),
      0,
    );
    const count_aktif = (pinjaman as any[]).filter(
      (p) => p.status === "proses",
    ).length;

    return {
      id_anggota: anggota.id,
      nama_anggota: anggota.nama,
      total_pinjaman,
      total_sisa,
      total_cicilan,
      status: count_aktif > 0 ? "proses" : "lunas",
      pinjaman: (pinjaman as any[]).map((p) => ({
        ...p,
        jumlah: Number(p.jumlah),
        sisa: Number(p.sisa),
        cicilan_paid: Number(p.cicilan_paid),
      })),
      cicilan: (cicilan as any[]).map((c) => ({
        ...c,
        jumlah: Number(c.jumlah),
      })),
    };
  }

  // Outstanding balance across active loans: SUM(jumlah - cicilan paid).
  static async getTotalPinjaman(id: number) {
    return await db("pinjaman as p")
      .where("p.id_anggota", id)
      .where("p.status", "proses")
      .select({
        total: db.raw(`
          COALESCE(SUM(p.jumlah - COALESCE((
            SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
          ), 0)), 0)
        `),
      })
      .first();
  }
}

export default Pinjaman;
