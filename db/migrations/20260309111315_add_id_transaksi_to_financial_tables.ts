import type { Knex } from "knex";

const TABLES = [
  "simpanan",
  "pinjaman",
  "cicilan",
  "infaq",
  "penarikan",
  "simpanan_sukarela",
  "tabungan_liburan",
];

export async function up(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.integer("id_transaksi").unsigned().nullable().defaultTo(null);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn("id_transaksi");
    });
  }
}
