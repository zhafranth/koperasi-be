import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("transaksi", (table) => {
    table.integer("id_anggota").nullable().alter();
  });

  // Expand jenis enum via raw SQL (Knex doesn't support ALTER ENUM directly)
  await knex.raw(`
    ALTER TABLE transaksi
    MODIFY COLUMN jenis ENUM('simpanan','pinjaman','cicilan','lainnya','sukarela','liburan','infaq','penarikan')
    NOT NULL
  `);

  // Migrate existing 'lainnya' rows to proper jenis based on keterangan
  await knex.raw(`
    UPDATE transaksi SET jenis = 'sukarela'
    WHERE jenis = 'lainnya' AND keterangan LIKE '%sukarela%'
  `);
  await knex.raw(`
    UPDATE transaksi SET jenis = 'liburan'
    WHERE jenis = 'lainnya' AND keterangan LIKE '%liburan%'
  `);
  await knex.raw(`
    UPDATE transaksi SET jenis = 'infaq'
    WHERE jenis = 'lainnya' AND keterangan LIKE '%nfaq%'
  `);
  await knex.raw(`
    UPDATE transaksi SET jenis = 'penarikan'
    WHERE jenis = 'lainnya' AND keterangan LIKE '%enarikan%'
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Revert jenis values back to 'lainnya'
  await knex.raw(`
    UPDATE transaksi SET jenis = 'lainnya'
    WHERE jenis IN ('sukarela','liburan','infaq','penarikan')
  `);

  await knex.raw(`
    ALTER TABLE transaksi
    MODIFY COLUMN jenis ENUM('simpanan','pinjaman','cicilan','lainnya')
    NOT NULL
  `);

  await knex.schema.alterTable("transaksi", (table) => {
    table.integer("id_anggota").notNullable().alter();
  });
}
