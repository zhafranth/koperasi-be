import db from "../../db";

class Transaksi {
  static async getAll({
    page = 1,
    limit = 10,
    jenis,
  }: {
    page?: number;
    limit?: number;
    jenis?: string;
  }) {
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await db("transaksi")
      .leftJoin("r_anggota", "transaksi.id_anggota", "r_anggota.id")
      .modify((qb) => {
        if (jenis) {
          qb.where("jenis", jenis);
        }
      })
      .count("transaksi.id as count")
      .first();

    // Get paginated data
    const data = await db("transaksi")
      .leftJoin("r_anggota", "transaksi.id_anggota", "r_anggota.id")
      .modify((qb) => {
        if (jenis) {
          qb.where("jenis", jenis);
        }
      })
      .select(
        "transaksi.id",
        "transaksi.jenis",
        "transaksi.jumlah",
        "transaksi.createdAt",
        "transaksi.keterangan",
        "r_anggota.nama as nama_anggota",
      )
      .orderBy("transaksi.createdAt", "desc")
      .offset(offset)
      .limit(limit);

    return {
      data,
      pagination: {
        total: Number(totalCount?.count || 0),
        page,
        total_pages: Math.ceil(Number(totalCount?.count || 0) / limit),
      },
    };
  }
  static async getById(id: number) {
    const data = await db("transaksi")
      .leftJoin("r_anggota", "transaksi.id_anggota", "r_anggota.id")
      .select(
        "transaksi.id",
        "transaksi.id_anggota",
        "transaksi.jenis",
        "transaksi.jumlah",
        "transaksi.createdAt",
        "transaksi.keterangan",
        "r_anggota.nama as nama_anggota",
      )
      .where("transaksi.id", id)
      .first();

    if (!data) {
      throw new Error("Transaksi tidak ditemukan");
    }

    return data;
  }

  static async delete(id: number) {
    const transaksi = await db("transaksi").where("id", id).first();
    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const { jenis } = transaksi;

    await db.transaction(async (trx) => {
      switch (jenis) {
        case "simpanan": {
          await trx("simpanan").where("id_transaksi", id).delete();
          break;
        }

        case "pinjaman": {
          const pinjaman = await trx("pinjaman")
            .where("id_transaksi", id)
            .first();
          if (pinjaman) {
            // Delete all cicilan and their transaksi records
            const cicilanList = await trx("cicilan")
              .where("id_pinjaman", pinjaman.id_pinjaman)
              .select("id_transaksi");
            const cicilanTransaksiIds = cicilanList
              .map((c: any) => c.id_transaksi)
              .filter(Boolean);

            await trx("cicilan")
              .where("id_pinjaman", pinjaman.id_pinjaman)
              .delete();
            if (cicilanTransaksiIds.length > 0) {
              await trx("transaksi")
                .whereIn("id", cicilanTransaksiIds)
                .delete();
            }
            await trx("pinjaman")
              .where("id_pinjaman", pinjaman.id_pinjaman)
              .delete();
          }
          break;
        }

        case "cicilan": {
          const cicilan = await trx("cicilan")
            .where("id_transaksi", id)
            .first();
          if (cicilan) {
            // Revert pinjaman status to 'proses' if it was 'lunas'
            await trx("pinjaman")
              .where("id_pinjaman", cicilan.id_pinjaman)
              .update({ status: "proses" });
            await trx("cicilan")
              .where("id_cicilan", cicilan.id_cicilan)
              .delete();
          }
          break;
        }

        case "infaq": {
          await trx("infaq").where("id_transaksi", id).delete();
          break;
        }

        case "sukarela": {
          await trx("simpanan_sukarela").where("id_transaksi", id).delete();
          break;
        }

        case "liburan": {
          await trx("tabungan_liburan").where("id_transaksi", id).delete();
          break;
        }

        case "penarikan": {
          await trx("penarikan").where("id_transaksi", id).delete();
          break;
        }

        default:
          break;
      }

      // Delete the transaksi record itself
      await trx("transaksi").where("id", id).delete();
    });
  }

  static async update(
    id: number,
    payload: { jumlah?: number; keterangan?: string },
  ) {
    const transaksi = await db("transaksi").where("id", id).first();
    if (!transaksi) {
      throw new Error("Transaksi tidak ditemukan");
    }

    const { jenis } = transaksi;
    const { jumlah, keterangan } = payload;

    const transaksiUpdate: Record<string, any> = {};
    if (keterangan !== undefined) transaksiUpdate.keterangan = keterangan;

    // Determine the new jumlah for transaksi (preserving sign convention)
    let newTransaksiJumlah: number | undefined;
    if (jumlah !== undefined && jumlah > 0) {
      // Transaksi stores negative for pinjaman/penarikan, positive for others
      const isNegative = ["pinjaman", "penarikan"].includes(jenis);
      newTransaksiJumlah = isNegative ? jumlah * -1 : jumlah;

      // For infaq keluar, check original sign
      if (jenis === "infaq" && Number(transaksi.jumlah) < 0) {
        newTransaksiJumlah = jumlah * -1;
      }

      transaksiUpdate.jumlah = newTransaksiJumlah;
    }

    await db.transaction(async (trx) => {
      // Update source table if jumlah changed
      if (jumlah !== undefined && jumlah > 0) {
        switch (jenis) {
          case "simpanan": {
            await trx("simpanan")
              .where("id_transaksi", id)
              .update({ jumlah });
            break;
          }

          case "pinjaman": {
            // Validate: new jumlah must be >= total cicilan already paid
            const pinjaman = await trx("pinjaman")
              .where("id_transaksi", id)
              .first();
            if (pinjaman) {
              const totalCicilan = await trx("cicilan")
                .where("id_pinjaman", pinjaman.id_pinjaman)
                .sum("jumlah as total")
                .first();
              if (jumlah < Number(totalCicilan?.total || 0)) {
                throw new Error(
                  `Jumlah pinjaman tidak boleh kurang dari total cicilan yang sudah dibayar (${totalCicilan?.total})`,
                );
              }
              await trx("pinjaman")
                .where("id_pinjaman", pinjaman.id_pinjaman)
                .update({ jumlah });
              // Recheck lunas status
              const isLunas =
                Math.round(Number(totalCicilan?.total || 0) * 100) ===
                Math.round(jumlah * 100);
              await trx("pinjaman")
                .where("id_pinjaman", pinjaman.id_pinjaman)
                .update({ status: isLunas ? "lunas" : "proses" });
            }
            break;
          }

          case "cicilan": {
            const cicilan = await trx("cicilan")
              .where("id_transaksi", id)
              .first();
            if (cicilan) {
              const pinjaman = await trx("pinjaman")
                .where("id_pinjaman", cicilan.id_pinjaman)
                .first();
              // Total cicilan lain (excluding this one)
              const otherCicilan = await trx("cicilan")
                .where("id_pinjaman", cicilan.id_pinjaman)
                .whereNot("id_cicilan", cicilan.id_cicilan)
                .sum("jumlah as total")
                .first();
              const otherTotal = Number(otherCicilan?.total || 0);
              if (otherTotal + jumlah > Number(pinjaman.jumlah)) {
                throw new Error(
                  `Jumlah cicilan melebihi sisa pinjaman`,
                );
              }
              await trx("cicilan")
                .where("id_cicilan", cicilan.id_cicilan)
                .update({ jumlah });
              // Recheck lunas status
              const isLunas =
                Math.round((otherTotal + jumlah) * 100) ===
                Math.round(Number(pinjaman.jumlah) * 100);
              await trx("pinjaman")
                .where("id_pinjaman", cicilan.id_pinjaman)
                .update({ status: isLunas ? "lunas" : "proses" });
            }
            break;
          }

          case "infaq": {
            const isKeluar = Number(transaksi.jumlah) < 0;
            const finalJumlah = isKeluar ? jumlah * -1 : jumlah;

            // Validate saldo for infaq keluar
            if (isKeluar) {
              const totalMasuk = await trx("infaq")
                .where("jenis", "masuk")
                .sum("jumlah as total")
                .first();
              const totalKeluar = await trx("infaq")
                .where("jenis", "keluar")
                .sum("jumlah as total")
                .first();
              const currentInfaq = await trx("infaq")
                .where("id_transaksi", id)
                .first();
              const saldoInfaq =
                Number(totalMasuk?.total || 0) -
                Math.abs(Number(totalKeluar?.total || 0)) +
                Math.abs(Number(currentInfaq?.jumlah || 0)); // add back current amount
              if (saldoInfaq < jumlah) {
                throw new Error(
                  `Saldo infaq tidak mencukupi. Saldo saat ini: ${saldoInfaq}`,
                );
              }
            }

            await trx("infaq")
              .where("id_transaksi", id)
              .update({ jumlah: finalJumlah });
            break;
          }

          case "sukarela": {
            await trx("simpanan_sukarela")
              .where("id_transaksi", id)
              .update({ jumlah });
            break;
          }

          case "liburan": {
            await trx("tabungan_liburan")
              .where("id_transaksi", id)
              .update({ jumlah });
            break;
          }

          case "penarikan": {
            await trx("penarikan")
              .where("id_transaksi", id)
              .update({ jumlah });
            break;
          }
        }
      }

      // Update keterangan on source table too
      if (keterangan !== undefined) {
        const sourceTableMap: Record<string, string> = {
          simpanan: "simpanan",
          pinjaman: "pinjaman",
          cicilan: "cicilan",
          infaq: "infaq",
          sukarela: "simpanan_sukarela",
          liburan: "tabungan_liburan",
          penarikan: "penarikan",
        };
        const sourceTable = sourceTableMap[jenis];
        if (sourceTable) {
          // Only update keterangan on tables that have the column
          const tablesWithKeterangan = [
            "pinjaman",
            "infaq",
            "simpanan_sukarela",
            "tabungan_liburan",
            "penarikan",
          ];
          if (tablesWithKeterangan.includes(sourceTable)) {
            await trx(sourceTable)
              .where("id_transaksi", id)
              .update({ keterangan });
          }
        }
      }

      // Update transaksi record
      if (Object.keys(transaksiUpdate).length > 0) {
        await trx("transaksi").where("id", id).update(transaksiUpdate);
      }
    });
  }

  static async getTotalTransaksi() {
    const [
      simpanan,
      infaqMasuk,
      sukarela,
      cicilan,
      liburan,
      pinjaman,
      penarikan,
      anggotaCount,
      penarikanSimpananSukarela,
      penarikanInfaq,
      penarikanLiburan,
    ] = await Promise.all([
      db("simpanan").sum("jumlah as total").first(),
      db("infaq").where("jenis", "masuk").sum("jumlah as total").first(),
      db("simpanan_sukarela").sum("jumlah as total").first(),
      db("cicilan").sum("jumlah as total").first(),
      db("tabungan_liburan").sum("jumlah as total").first(),
      db("pinjaman").where("status", "proses").sum("jumlah as total").first(),
      db("penarikan")
        .where("sumber", "simpanan")
        .sum("jumlah as total")
        .first(),
      db("r_anggota").count("id as total").first(),
      db("penarikan")
        .where("sumber", "sukarela")
        .sum("jumlah as total")
        .first(),
      db("penarikan").where("sumber", "infaq").sum("jumlah as total").first(),
      db("penarikan").where("sumber", "liburan").sum("jumlah as total").first(),
    ]);

    const jumlahDana =
      Number(simpanan?.total || 0) +
      Number(infaqMasuk?.total || 0) +
      Number(sukarela?.total || 0) +
      Number(cicilan?.total || 0) +
      Number(liburan?.total || 0);

    const jumlah_infaq =
      Number(infaqMasuk?.total || 0) - Number(penarikanInfaq?.total || 0);
    const jumlah_tabungan_liburan =
      Number(liburan?.total || 0) - Number(penarikanLiburan?.total || 0);
    const jumlah_simpanan_sukarela =
      Number(sukarela?.total || 0) -
      Number(penarikanSimpananSukarela?.total || 0);
    const total_dana =
      jumlahDana +
      Number(jumlah_infaq) +
      Number(jumlah_tabungan_liburan) +
      (Number(jumlah_simpanan_sukarela) -
        (Number(penarikan?.total || 0) + Number(pinjaman?.total || 0)));

    return {
      total_anggota: Number(anggotaCount?.total || 0),
      jumlah_dana: jumlahDana,
      jumlah_pinjaman: Number(pinjaman?.total || 0),
      jumlah_simpanan_sukarela,
      jumlah_infaq,
      jumlah_tabungan_liburan,
      total_dana,
    };
  }
}

export default Transaksi;
