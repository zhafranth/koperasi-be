import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("penarikan", (table) => {
    table
      .enum("sumber", ["simpanan", "sukarela", "infaq", "liburan"])
      .notNullable()
      .defaultTo("simpanan");
    table.text("keterangan").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("penarikan", (table) => {
    table.dropColumn("sumber");
    table.dropColumn("keterangan");
  });
}
