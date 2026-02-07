import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("events", (table) => {
    table.increments("id").primary();
    table.string("title", 255).notNullable();
    table.text("description").nullable();
    table.date("tanggal").notNullable();
    table.string("waktu", 100).nullable();
    table.string("location", 255).nullable();
    table
      .enum("kategori", [
        "rapat",
        "pelatihan",
        "sosial",
        "silaturahmi",
        "olahraga",
        "pendidikan",
        "kesehatan",
        "keagamaan",
        "musyawarah",
        "penggalangan_dana",
      ])
      .notNullable()
      .defaultTo("rapat");
    table.datetime("createdAt").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("events");
}
