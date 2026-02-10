import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("penarikan", (table) => {
    table.integer("id_anggota").nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("penarikan", (table) => {
    table.integer("id_anggota").notNullable().alter();
  });
}
