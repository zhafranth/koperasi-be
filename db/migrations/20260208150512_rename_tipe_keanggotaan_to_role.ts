import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("r_anggota", (table) => {
    table.dropColumn("tipe_keanggotaan");
  });
  await knex.schema.alterTable("r_anggota", (table) => {
    table
      .enum("role", ["pengurus", "anggota"])
      .nullable()
      .defaultTo("anggota");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("r_anggota", (table) => {
    table.dropColumn("role");
  });
  await knex.schema.alterTable("r_anggota", (table) => {
    table.string("tipe_keanggotaan", 100).nullable();
  });
}
