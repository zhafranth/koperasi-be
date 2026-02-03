import db from "../../db";
import dayjs from "dayjs";

class Simpanan {
  static async getAll() {
    return await db("simpanan");
  }

  static async getByUserId(id: number) {
    return await db("simpanan").where("id_anggota", id);
  }

  static async create(payload: any) {
    try {
      const { jumlah, id_anggota, start, end } = payload;
      const anggota = await db("r_anggota").where("id", id_anggota).first();

      if (!anggota) {
        throw new Error("Aggota not found");
      }

      let startDate = dayjs(start);
      let endDate = dayjs(end);

      if (!startDate.isValid() || !endDate.isValid()) {
        if (Number.isFinite(Number(start)) && Number.isFinite(Number(end))) {
          const currentYear = dayjs().year();
          startDate = dayjs()
            .year(currentYear)
            .month(Number(start) - 1)
            .date(1);
          endDate = dayjs()
            .year(currentYear)
            .month(Number(end) - 1)
            .date(1);
        } else {
          throw new Error("Format tanggal start/end tidak valid");
        }
      }

      const monthCount = endDate.diff(startDate, "month") + 1;

      if (!Number.isFinite(monthCount) || monthCount <= 0) {
        throw new Error("Rentang bulan tidak valid");
      }

      const totalJumlah = Number(jumlah);
      if (!Number.isFinite(totalJumlah) || totalJumlah <= 0) {
        throw new Error("Jumlah simpanan tidak valid");
      }

      const perMonth = Math.floor(totalJumlah / monthCount);
      const remainder = totalJumlah - perMonth * monthCount;

      const monthsToInsert = Array.from({ length: monthCount }).map((_, i) => {
        const current = startDate.add(i, "month").startOf("month");
        return {
          bulan: current.month() + 1,
          tahun: current.year(),
        };
      });

      const existing = await db("simpanan")
        .where("id_anggota", id_anggota)
        .where(function (qb: any) {
          monthsToInsert.forEach(({ bulan, tahun }, idx) => {
            if (idx === 0) {
              qb.where({ bulan, tahun });
            } else {
              qb.orWhere({ bulan, tahun });
            }
          });
        })
        .select("bulan", "tahun");

      if (existing.length > 0) {
        const dupList = existing
          .map((e: any) => `${String(e.bulan).padStart(2, "0")}-${e.tahun}`)
          .join(", ");
        throw new Error(
          `Simpanan untuk kombinasi bulan-tahun sudah ada: ${dupList}`,
        );
      }

      await db.transaction(async (trx: any) => {
        for (let i = 0; i < monthCount; i++) {
          const current = startDate.add(i, "month").startOf("month");
          const bulan = current.month() + 1;
          const tahun = current.year();
          const amount = perMonth + (i === monthCount - 1 ? remainder : 0);

          const simpananData = {
            id_anggota,
            jumlah: amount,
            bulan,
            tahun,
          };
          const transaksiData = {
            id_anggota,
            jenis: "simpanan",
            jumlah: amount,
          };

          await trx("simpanan").insert(simpananData);
          await trx("transaksi").insert(transaksiData);
        }
      });
    } catch (error) {
      throw error; // Rethrow the error for handling in the calling code
    }
  }
}

export default Simpanan;
