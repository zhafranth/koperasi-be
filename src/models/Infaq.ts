import db from "../../db";

class Infaq {
  static async getAll() {
    return await db("infaq as i")
      .leftJoin("r_anggota as a", "i.id_anggota", "a.id")
      .select(
        "i.id",
        "i.id_anggota",
        "a.nama",
        "i.jumlah",
        "i.jenis",
        "i.keterangan",
        "i.createdAt"
      )
      .orderBy("i.createdAt", "desc");
  }

  static async create(payload: any) {
    try {
      const { id_anggota, jumlah, jenis, keterangan } = payload;

      if (!jumlah || Number(jumlah) <= 0) {
        throw new Error("Jumlah infaq tidak valid");
      }

      if (id_anggota) {
        const anggota = await db("r_anggota").where("id", id_anggota).first();
        if (!anggota) {
          throw new Error("Anggota tidak ditemukan");
        }
      }

      const isKeluar = jenis === "keluar";

      if (isKeluar) {
        const totalMasuk = await db("infaq")
          .where("jenis", "masuk")
          .sum("jumlah as total");
        const totalKeluar = await db("infaq")
          .where("jenis", "keluar")
          .sum("jumlah as total");

        const saldoInfaq =
          Number(totalMasuk[0]?.total || 0) -
          Number(totalKeluar[0]?.total || 0);

        if (saldoInfaq < Number(jumlah)) {
          throw new Error(
            `Saldo infaq tidak mencukupi. Saldo saat ini: ${saldoInfaq}`
          );
        }
      }

      const finalJumlah = isKeluar ? Number(jumlah) * -1 : Number(jumlah);

      await db.transaction(async (trx) => {
        await trx("infaq").insert({
          id_anggota: id_anggota || null,
          jumlah: finalJumlah,
          jenis: jenis || "masuk",
          keterangan: keterangan || null,
        });
        await trx("transaksi").insert({
          id_anggota: id_anggota || null,
          jenis: "lainnya",
          jumlah: finalJumlah,
          keterangan: keterangan || `Infaq ${jenis || "masuk"}`,
        });
      });
    } catch (error) {
      throw error;
    }
  }
}

export default Infaq;
