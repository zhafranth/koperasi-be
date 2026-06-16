import db from "../../db";

class Cicilan {
  static async getAll() {
    return await db("cicilan");
  }
  static async getByPinjamanId(id: number) {
    const result = await db("cicilan as c").where("c.id_pinjaman", id);
    return result;
  }

  // 1 payment → distributed across this anggota's active loans, oldest first.
  // Inserts a SINGLE transaksi row (audit log) and 1..N cicilan rows linked to
  // it. Loans whose sisa hits 0 are flipped to 'lunas' in the same txn.
  // Rejects overpayments (jumlah > total outstanding).
  static async createDistributed({
    id_anggota,
    jumlah,
    keterangan,
  }: {
    id_anggota: number;
    jumlah: number;
    keterangan?: string;
  }) {
    if (!id_anggota) throw new Error("id_anggota wajib diisi");
    if (!jumlah || Number(jumlah) <= 0)
      throw new Error("Jumlah cicilan harus lebih besar dari 0");

    const activePinjaman = await db("pinjaman as p")
      .where("p.id_anggota", id_anggota)
      .where("p.status", "proses")
      .select("p.id_pinjaman", "p.jumlah", {
        sisa: db.raw(`p.jumlah - COALESCE((
          SELECT SUM(c.jumlah) FROM cicilan c WHERE c.id_pinjaman = p.id_pinjaman
        ), 0)`),
      })
      .orderBy("p.createdAt", "asc"); // FIFO

    if (activePinjaman.length === 0)
      throw new Error("Tidak ada pinjaman aktif untuk dicicil");

    const totalSisa = (activePinjaman as any[]).reduce(
      (s, p) => s + Number(p.sisa),
      0,
    );
    if (Number(jumlah) > totalSisa) {
      throw new Error(
        `Jumlah cicilan melebihi total sisa pinjaman (sisa: ${totalSisa})`,
      );
    }

    await db.transaction(async (trx) => {
      const [idTransaksi] = await trx("transaksi").insert({
        id_anggota,
        jenis: "cicilan",
        jumlah,
        keterangan,
      });

      let remaining = Number(jumlah);
      for (const p of activePinjaman as any[]) {
        if (remaining <= 0) break;
        const sisa = Number(p.sisa);
        if (sisa <= 0) continue;
        const apply = Math.min(remaining, sisa);

        await trx("cicilan").insert({
          id_pinjaman: p.id_pinjaman,
          jumlah: apply,
          id_transaksi: idTransaksi,
        });

        if (apply >= sisa) {
          await trx("pinjaman")
            .where("id_pinjaman", p.id_pinjaman)
            .update({ status: "lunas" });
        }
        remaining -= apply;
      }
    });
  }

  static async getByUserId(id: number) {
    return await db("cicilan as c")
      .join("pinjaman as p", "c.id_pinjaman", "p.id_pinjaman")
      .where("p.id_anggota", id)
      .select(
        "c.id_cicilan as id",
        "c.id_pinjaman",
        "c.jumlah",
        "c.createdAt as tanggal_bayar",
        "p.keterangan",
      )
      .orderBy("c.createdAt", "desc");
  }
  static async create(payload: any) {
    try {
      const { id_pinjaman, jumlah } = payload;

      const pinjaman = await db("pinjaman")
        .where("id_pinjaman", id_pinjaman)
        .first();

      const cicilan = await db("cicilan")
        .where("id_pinjaman", id_pinjaman)
        .sum("jumlah as total_cicilan")
        .first();

      if (!pinjaman) {
        throw new Error("Pinjaman tidak tersedia");
      }
      if (jumlah > pinjaman.jumlah - (cicilan?.total_cicilan || 0)) {
        throw new Error("Jumlah cicilan melebihi sisa pinjaman");
      }

      await db.transaction(async (trx) => {
        const [idCicilan] = await trx("cicilan").insert({
          id_pinjaman,
          jumlah,
        });
        const [idTransaksi] = await trx("transaksi").insert({
          id_anggota: pinjaman.id_anggota,
          jenis: "cicilan",
          jumlah: jumlah,
        });
        await trx("cicilan")
          .where("id_cicilan", idCicilan)
          .update({ id_transaksi: idTransaksi });

        if (
          Number(cicilan?.total_cicilan || 0) + Number(jumlah) ===
          Number(pinjaman.jumlah)
        ) {
          await trx("pinjaman")
            .update({ status: "lunas" })
            .where("id_pinjaman", id_pinjaman);
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

export default Cicilan;
