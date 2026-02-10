import db from "../../db";

type Sumber = "simpanan" | "sukarela" | "infaq" | "liburan";

const SUMBER_KOPERASI: Sumber[] = ["infaq", "sukarela"];

class Penarikan {
  static async getAll(query?: { sumber?: string }) {
    const q = db("penarikan as p")
      .leftJoin("r_anggota as a", "p.id_anggota", "a.id")
      .select(
        "p.id",
        "p.id_anggota",
        "a.nama",
        "p.jumlah",
        "p.tanggal",
        "p.tahun",
        "p.sumber",
        "p.keterangan"
      )
      .orderBy("p.tanggal", "desc");

    if (query?.sumber) {
      q.where("p.sumber", query.sumber);
    }

    return await q;
  }

  static async getById(id: number) {
    const data = await db("penarikan as p")
      .leftJoin("r_anggota as a", "p.id_anggota", "a.id")
      .select(
        "p.id",
        "p.id_anggota",
        "a.nama",
        "p.jumlah",
        "p.tanggal",
        "p.tahun",
        "p.sumber",
        "p.keterangan"
      )
      .where("p.id", id)
      .first();

    if (!data) {
      throw new Error("Penarikan tidak ditemukan");
    }

    return data;
  }

  static async getSaldo(idAnggota: number | null, sumber: Sumber) {
    switch (sumber) {
      case "simpanan": {
        const totalSetor = await db("simpanan")
          .where("id_anggota", idAnggota)
          .sum("jumlah as total");
        const totalTarik = await db("penarikan")
          .where("id_anggota", idAnggota)
          .where("sumber", "simpanan")
          .sum("jumlah as total");
        return (
          Number(totalSetor[0]?.total || 0) -
          Number(totalTarik[0]?.total || 0)
        );
      }

      case "sukarela": {
        const totalSetor = await db("simpanan_sukarela")
          .sum("jumlah as total");
        const totalTarik = await db("penarikan")
          .where("sumber", "sukarela")
          .sum("jumlah as total");
        return (
          Number(totalSetor[0]?.total || 0) -
          Number(totalTarik[0]?.total || 0)
        );
      }

      case "infaq": {
        const totalMasuk = await db("infaq")
          .where("jenis", "masuk")
          .sum("jumlah as total");
        const totalKeluar = await db("infaq")
          .where("jenis", "keluar")
          .sum("jumlah as total");
        const totalTarikInfaq = await db("penarikan")
          .where("sumber", "infaq")
          .sum("jumlah as total");
        return (
          Number(totalMasuk[0]?.total || 0) -
          Math.abs(Number(totalKeluar[0]?.total || 0)) -
          Number(totalTarikInfaq[0]?.total || 0)
        );
      }

      case "liburan": {
        const totalSetorLiburan = await db("tabungan_liburan")
          .where("id_anggota", idAnggota)
          .sum("jumlah as total");
        const totalTarikLiburan = await db("penarikan")
          .where("id_anggota", idAnggota)
          .where("sumber", "liburan")
          .sum("jumlah as total");
        return (
          Number(totalSetorLiburan[0]?.total || 0) -
          Number(totalTarikLiburan[0]?.total || 0)
        );
      }

      default:
        throw new Error("Sumber tidak valid");
    }
  }

  static async create(payload: any) {
    const { id_anggota, jumlah, sumber, keterangan } = payload;

    if (!jumlah || Number(jumlah) <= 0) {
      throw new Error("Jumlah tidak valid");
    }

    const validSumber: Sumber[] = ["simpanan", "sukarela", "infaq", "liburan"];
    if (!sumber || !validSumber.includes(sumber)) {
      throw new Error("Sumber penarikan tidak valid");
    }

    const isSumberKoperasi = SUMBER_KOPERASI.includes(sumber);

    // Untuk simpanan & liburan, anggota wajib dipilih
    if (!isSumberKoperasi) {
      if (!id_anggota) {
        throw new Error("Anggota harus dipilih");
      }
      const anggota = await db("r_anggota").where("id", id_anggota).first();
      if (!anggota) {
        throw new Error("Anggota tidak ditemukan");
      }
    }

    // Validasi saldo
    const saldo = await this.getSaldo(
      isSumberKoperasi ? null : id_anggota,
      sumber
    );

    if (saldo < Number(jumlah)) {
      const sumberLabel: Record<string, string> = {
        simpanan: "Simpanan",
        sukarela: "Simpanan sukarela",
        infaq: "Infaq",
        liburan: "Tabungan liburan",
      };
      throw new Error(
        `Saldo ${sumberLabel[sumber]} tidak mencukupi. Saldo saat ini: ${saldo}`
      );
    }

    const now = new Date();

    await db.transaction(async (trx) => {
      await trx("penarikan").insert({
        id_anggota: isSumberKoperasi ? null : id_anggota,
        jumlah: Number(jumlah),
        tanggal: now,
        tahun: String(now.getFullYear()),
        sumber,
        keterangan: keterangan || null,
      });

      await trx("transaksi").insert({
        id_anggota: isSumberKoperasi ? null : id_anggota,
        jenis: "penarikan",
        jumlah: Number(jumlah) * -1,
        keterangan: keterangan || `Penarikan ${sumber}`,
      });
    });
  }

  static async delete(id: number) {
    const existing = await db("penarikan").where("id", id).first();
    if (!existing) {
      throw new Error("Penarikan tidak ditemukan");
    }

    await db.transaction(async (trx) => {
      await trx("penarikan").where("id", id).delete();

      await trx("transaksi").insert({
        id_anggota: existing.id_anggota || null,
        jenis: "penarikan",
        jumlah: Number(existing.jumlah),
        keterangan: `Pembatalan penarikan ${existing.sumber}`,
      });
    });
  }
}

export default Penarikan;
