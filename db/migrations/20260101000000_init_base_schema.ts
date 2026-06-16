import type { Knex } from "knex";

// Match DATABASE.md: all PKs are signed int(11), all FKs are signed int(11).
// Existing alter migrations also use signed `integer("id_anggota")` — using
// `.increments()` (unsigned) would break FK type compatibility.
const pk = (t: Knex.CreateTableBuilder, name: string) =>
  t.specificType(name, "INT NOT NULL AUTO_INCREMENT").primary();

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("r_keluarga", (t) => {
    pk(t, "id_keluarga");
    t.string("nama_kepala_keluarga", 255).nullable();
    t.datetime("tgl_gabung").nullable();
    t.datetime("created_date").notNullable().defaultTo(knex.fn.now());
    t.datetime("updated_date").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("r_anggota", (t) => {
    pk(t, "id");
    t.integer("id_keluarga").nullable()
      .references("id_keluarga").inTable("r_keluarga");
    t.string("nama", 100).notNullable();
    t.string("nik", 50).nullable();
    t.text("alamat").nullable();
    t.string("no_telepon", 15).nullable();
    t.string("email", 100).nullable();
    t.string("tipe_keanggotaan", 100).nullable();
    t.datetime("tgl_gabung").nullable().defaultTo(knex.fn.now());
    t.enum("status", ["aktif", "non-aktif"]).notNullable();
    t.string("username", 50).unique().nullable();
    t.string("password", 255).nullable();
  });

  await knex.schema.createTable("simpanan", (t) => {
    pk(t, "id");
    t.integer("id_anggota").notNullable()
      .references("id").inTable("r_anggota");
    t.decimal("jumlah", 15, 2).notNullable();
    t.datetime("tanggal").notNullable().defaultTo(knex.fn.now());
    t.string("bulan", 2).nullable();
    t.string("tahun", 4).nullable();
    t.enum("metode_pembayaran", ["transfer", "tunai"]).nullable().defaultTo("transfer");
    t.enum("status", ["pending", "ditolak", "diterima"]).nullable().defaultTo("diterima");
  });

  await knex.schema.createTable("pinjaman", (t) => {
    pk(t, "id_pinjaman");
    t.integer("id_anggota").notNullable()
      .references("id").inTable("r_anggota");
    t.decimal("jumlah", 15, 2).notNullable();
    t.datetime("createdAt").nullable().defaultTo(knex.fn.now());
    t.enum("status", ["proses", "lunas"]).nullable().defaultTo("proses");
    t.text("keterangan").nullable();
  });

  await knex.schema.createTable("cicilan", (t) => {
    pk(t, "id_cicilan");
    t.integer("id_pinjaman").notNullable()
      .references("id_pinjaman").inTable("pinjaman");
    t.decimal("jumlah", 15, 2).notNullable();
    t.datetime("createdAt").nullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("transaksi", (t) => {
    pk(t, "id");
    t.integer("id_anggota").notNullable();
    t.enum("jenis", ["simpanan", "pinjaman", "cicilan", "lainnya"]).notNullable();
    t.decimal("jumlah", 15, 2).notNullable();
    t.datetime("createdAt").nullable().defaultTo(knex.fn.now());
    t.text("keterangan").nullable();
  });

  await knex.schema.createTable("pengurus", (t) => {
    pk(t, "id");
    t.integer("id_anggota").notNullable().unique()
      .references("id").inTable("r_anggota");
    t.string("jabatan", 50).notNullable();
    t.enum("status", ["aktif", "non-aktif"]).notNullable();
  });

  await knex.schema.createTable("infaq", (t) => {
    pk(t, "id");
    t.integer("id_anggota").nullable()
      .references("id").inTable("r_anggota");
    t.datetime("createdAt").nullable().defaultTo(knex.fn.now());
    t.text("keterangan").nullable();
    t.decimal("jumlah", 15, 2).nullable();
    t.enum("jenis", ["masuk", "keluar"]).nullable().defaultTo("masuk");
  });

  await knex.schema.createTable("penarikan", (t) => {
    pk(t, "id");
    t.decimal("jumlah", 10, 0).notNullable();
    t.integer("id_anggota").notNullable()
      .references("id").inTable("r_anggota");
    t.datetime("tanggal").nullable().defaultTo(knex.fn.now());
    t.string("tahun", 6).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("penarikan");
  await knex.schema.dropTableIfExists("infaq");
  await knex.schema.dropTableIfExists("pengurus");
  await knex.schema.dropTableIfExists("transaksi");
  await knex.schema.dropTableIfExists("cicilan");
  await knex.schema.dropTableIfExists("pinjaman");
  await knex.schema.dropTableIfExists("simpanan");
  await knex.schema.dropTableIfExists("r_anggota");
  await knex.schema.dropTableIfExists("r_keluarga");
}
