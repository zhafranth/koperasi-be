import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("simpanan_sukarela", (table) => {
    table.increments("id").primary();
    table
      .integer("id_anggota")
      .notNullable()
      .references("id")
      .inTable("r_anggota")
      .onDelete("CASCADE");
    table.decimal("jumlah", 15, 2).notNullable();
    table.datetime("tanggal").notNullable().defaultTo(knex.fn.now());
    table.text("keterangan").nullable();
    table.datetime("createdAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("simpanan_sukarela");
}
