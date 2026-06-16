import type { Knex } from "knex";
import bcrypt from "bcryptjs";
import dayjs from "dayjs";

// Idempotent demo seed. Wipes financial/membership data then re-inserts a
// realistic dataset: 3 families, 1 admin + 7 members, 6 months of simpanan,
// 2 active loans with cicilan, infaq, sukarela, liburan, penarikan, events.

const HASHED_ADMIN = bcrypt.hashSync("admin123", 10);
const HASHED_USER = bcrypt.hashSync("password", 10);

const today = dayjs();

export async function seed(knex: Knex): Promise<void> {
  // FK-safe wipe order (children first). Disable FK checks for clean truncate.
  await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of [
    "cicilan",
    "pinjaman",
    "simpanan",
    "simpanan_sukarela",
    "tabungan_liburan",
    "infaq",
    "penarikan",
    "transaksi",
    "events",
    "pengurus",
    "r_anggota",
    "r_keluarga",
  ]) {
    await knex(table).del();
    await knex.raw(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }
  await knex.raw("SET FOREIGN_KEY_CHECKS = 1");

  // ─── Keluarga ──────────────────────────────────────────────────
  await knex("r_keluarga").insert([
    { id_keluarga: 1, nama_kepala_keluarga: "Budi Santoso", tgl_gabung: "2024-01-15 00:00:00" },
    { id_keluarga: 2, nama_kepala_keluarga: "Siti Aminah", tgl_gabung: "2024-03-10 00:00:00" },
    { id_keluarga: 3, nama_kepala_keluarga: "Agus Pratama", tgl_gabung: "2024-06-22 00:00:00" },
  ]);

  // ─── Anggota ──────────────────────────────────────────────────
  // id=1 admin/pengurus (Ketua), sisanya anggota biasa
  await knex("r_anggota").insert([
    {
      id: 1, id_keluarga: 1, nama: "Budi Santoso", nik: "3201010101010001",
      alamat: "Jl. Mawar No. 1, Bogor", no_telepon: "081234567001",
      email: "budi.santoso@example.com", role: "pengurus",
      tgl_gabung: "2024-01-15 00:00:00", status: "aktif",
      username: "admin", password: HASHED_ADMIN,
    },
    {
      id: 2, id_keluarga: 1, nama: "Dewi Santoso", nik: "3201010101010002",
      alamat: "Jl. Mawar No. 1, Bogor", no_telepon: "081234567002",
      email: "dewi.santoso@example.com", role: "anggota",
      tgl_gabung: "2024-01-15 00:00:00", status: "aktif",
      username: "dewi", password: HASHED_USER,
    },
    {
      id: 3, id_keluarga: 2, nama: "Siti Aminah", nik: "3201010101010003",
      alamat: "Jl. Melati No. 5, Bogor", no_telepon: "081234567003",
      email: "siti.aminah@example.com", role: "anggota",
      tgl_gabung: "2024-03-10 00:00:00", status: "aktif",
      username: "siti", password: HASHED_USER,
    },
    {
      id: 4, id_keluarga: 2, nama: "Rahmat Hidayat", nik: "3201010101010004",
      alamat: "Jl. Melati No. 5, Bogor", no_telepon: "081234567004",
      email: "rahmat.h@example.com", role: "anggota",
      tgl_gabung: "2024-03-10 00:00:00", status: "aktif",
      username: "rahmat", password: HASHED_USER,
    },
    {
      id: 5, id_keluarga: 3, nama: "Agus Pratama", nik: "3201010101010005",
      alamat: "Jl. Kenanga No. 12, Bogor", no_telepon: "081234567005",
      email: "agus.p@example.com", role: "anggota",
      tgl_gabung: "2024-06-22 00:00:00", status: "aktif",
      username: "agus", password: HASHED_USER,
    },
    {
      id: 6, id_keluarga: 3, nama: "Nina Pratama", nik: "3201010101010006",
      alamat: "Jl. Kenanga No. 12, Bogor", no_telepon: "081234567006",
      email: "nina.p@example.com", role: "anggota",
      tgl_gabung: "2024-06-22 00:00:00", status: "aktif",
      username: "nina", password: HASHED_USER,
    },
    {
      id: 7, id_keluarga: 1, nama: "Eko Santoso", nik: "3201010101010007",
      alamat: "Jl. Mawar No. 1, Bogor", no_telepon: "081234567007",
      email: "eko.s@example.com", role: "anggota",
      tgl_gabung: "2024-09-01 00:00:00", status: "aktif",
      username: "eko", password: HASHED_USER,
    },
    {
      id: 8, id_keluarga: 2, nama: "Lina Aminah", nik: "3201010101010008",
      alamat: "Jl. Melati No. 5, Bogor", no_telepon: "081234567008",
      email: "lina.a@example.com", role: "anggota",
      tgl_gabung: "2025-01-12 00:00:00", status: "non-aktif",
      username: "lina", password: HASHED_USER,
    },
  ]);

  // ─── Pengurus ──────────────────────────────────────────────────
  await knex("pengurus").insert([
    { id_anggota: 1, jabatan: "Ketua", status: "aktif" },
  ]);

  // ─── Simpanan: 6 bulan terakhir × semua anggota aktif ─────────
  const activeMemberIds = [1, 2, 3, 4, 5, 6, 7];
  const simpananRows: any[] = [];
  const transaksiRows: any[] = [];
  const nominal = 100_000;

  for (let m = 5; m >= 0; m--) {
    const dt = today.subtract(m, "month").date(5);
    const bulan = String(dt.month() + 1).padStart(2, "0");
    const tahun = String(dt.year());
    for (const id_anggota of activeMemberIds) {
      simpananRows.push({
        id_anggota,
        jumlah: nominal,
        tanggal: dt.format("YYYY-MM-DD HH:mm:ss"),
        bulan,
        tahun,
        metode_pembayaran: "transfer",
        status: "diterima",
      });
      transaksiRows.push({
        id_anggota,
        jenis: "simpanan",
        jumlah: nominal,
        createdAt: dt.format("YYYY-MM-DD HH:mm:ss"),
        keterangan: `Simpanan bulan ${bulan}/${tahun}`,
      });
    }
  }
  await knex("simpanan").insert(simpananRows);

  // ─── Pinjaman aktif + cicilan ─────────────────────────────────
  // Anggota 3 (Siti) pinjam 2.000.000, sudah cicil 2x @ 500.000 → sisa 1jt
  // Anggota 5 (Agus) pinjam 1.500.000 lunas (cicil 3x @ 500.000)
  await knex("pinjaman").insert([
    {
      id_pinjaman: 1, id_anggota: 3, jumlah: 2_000_000,
      createdAt: today.subtract(3, "month").format("YYYY-MM-DD HH:mm:ss"),
      status: "proses", keterangan: "Modal usaha warung",
    },
    {
      id_pinjaman: 2, id_anggota: 5, jumlah: 1_500_000,
      createdAt: today.subtract(5, "month").format("YYYY-MM-DD HH:mm:ss"),
      status: "lunas", keterangan: "Biaya pendidikan anak",
    },
  ]);
  transaksiRows.push(
    {
      id_anggota: 3, jenis: "pinjaman", jumlah: 2_000_000,
      createdAt: today.subtract(3, "month").format("YYYY-MM-DD HH:mm:ss"),
      keterangan: "Pencairan pinjaman: Modal usaha warung",
    },
    {
      id_anggota: 5, jenis: "pinjaman", jumlah: 1_500_000,
      createdAt: today.subtract(5, "month").format("YYYY-MM-DD HH:mm:ss"),
      keterangan: "Pencairan pinjaman: Biaya pendidikan anak",
    },
  );

  await knex("cicilan").insert([
    {
      id_pinjaman: 1, jumlah: 500_000,
      createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      id_pinjaman: 1, jumlah: 500_000,
      createdAt: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      id_pinjaman: 2, jumlah: 500_000,
      createdAt: today.subtract(4, "month").format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      id_pinjaman: 2, jumlah: 500_000,
      createdAt: today.subtract(3, "month").format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      id_pinjaman: 2, jumlah: 500_000,
      createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"),
    },
  ]);
  // Transaksi log untuk cicilan
  transaksiRows.push(
    { id_anggota: 3, jenis: "cicilan", jumlah: 500_000, createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Cicilan ke-1 pinjaman #1" },
    { id_anggota: 3, jenis: "cicilan", jumlah: 500_000, createdAt: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Cicilan ke-2 pinjaman #1" },
    { id_anggota: 5, jenis: "cicilan", jumlah: 500_000, createdAt: today.subtract(4, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Cicilan ke-1 pinjaman #2" },
    { id_anggota: 5, jenis: "cicilan", jumlah: 500_000, createdAt: today.subtract(3, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Cicilan ke-2 pinjaman #2" },
    { id_anggota: 5, jenis: "cicilan", jumlah: 500_000, createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Cicilan ke-3 pinjaman #2 (lunas)" },
  );

  // ─── Infaq ────────────────────────────────────────────────────
  await knex("infaq").insert([
    { id_anggota: 1, createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Infaq Jumat", jumlah: 50_000, jenis: "masuk" },
    { id_anggota: 2, createdAt: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Infaq bulanan", jumlah: 75_000, jenis: "masuk" },
    { id_anggota: null, createdAt: today.subtract(15, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Donasi anonim", jumlah: 200_000, jenis: "masuk" },
  ]);
  transaksiRows.push(
    { id_anggota: 1, jenis: "infaq", jumlah: 50_000, createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Infaq Jumat" },
    { id_anggota: 2, jenis: "infaq", jumlah: 75_000, createdAt: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Infaq bulanan" },
    { id_anggota: null, jenis: "infaq", jumlah: 200_000, createdAt: today.subtract(15, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Donasi anonim" },
  );

  // ─── Simpanan Sukarela ───────────────────────────────────────
  await knex("simpanan_sukarela").insert([
    { id_anggota: 1, jumlah: 250_000, tanggal: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Kontribusi sukarela" },
    { id_anggota: 4, jumlah: 150_000, tanggal: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Kontribusi sukarela" },
    { id_anggota: 6, jumlah: 100_000, tanggal: today.subtract(10, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Kontribusi sukarela" },
  ]);
  transaksiRows.push(
    { id_anggota: 1, jenis: "sukarela", jumlah: 250_000, createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Simpanan sukarela" },
    { id_anggota: 4, jenis: "sukarela", jumlah: 150_000, createdAt: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Simpanan sukarela" },
    { id_anggota: 6, jenis: "sukarela", jumlah: 100_000, createdAt: today.subtract(10, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Simpanan sukarela" },
  );

  // ─── Tabungan Liburan ────────────────────────────────────────
  await knex("tabungan_liburan").insert([
    { id_anggota: 2, jumlah: 200_000, tanggal: today.subtract(3, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Tabungan liburan akhir tahun" },
    { id_anggota: 3, jumlah: 300_000, tanggal: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Tabungan liburan akhir tahun" },
    { id_anggota: 5, jumlah: 250_000, tanggal: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Tabungan liburan akhir tahun" },
  ]);
  transaksiRows.push(
    { id_anggota: 2, jenis: "liburan", jumlah: 200_000, createdAt: today.subtract(3, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Tabungan liburan" },
    { id_anggota: 3, jenis: "liburan", jumlah: 300_000, createdAt: today.subtract(2, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Tabungan liburan" },
    { id_anggota: 5, jenis: "liburan", jumlah: 250_000, createdAt: today.subtract(1, "month").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Tabungan liburan" },
  );

  // ─── Penarikan ──────────────────────────────────────────────
  // Sumber simpanan/liburan → per anggota. Sumber sukarela/infaq → dana koperasi (id_anggota null).
  await knex("penarikan").insert([
    {
      jumlah: 300_000, id_anggota: 4,
      tanggal: today.subtract(20, "day").format("YYYY-MM-DD HH:mm:ss"),
      tahun: today.format("YYYY"), sumber: "simpanan",
      keterangan: "Penarikan kebutuhan mendesak",
    },
    {
      jumlah: 150_000, id_anggota: null,
      tanggal: today.subtract(7, "day").format("YYYY-MM-DD HH:mm:ss"),
      tahun: today.format("YYYY"), sumber: "infaq",
      keterangan: "Bantuan musibah anggota",
    },
    {
      jumlah: 100_000, id_anggota: null,
      tanggal: today.subtract(5, "day").format("YYYY-MM-DD HH:mm:ss"),
      tahun: today.format("YYYY"), sumber: "sukarela",
      keterangan: "Operasional rapat",
    },
  ]);
  transaksiRows.push(
    { id_anggota: 4, jenis: "penarikan", jumlah: -300_000, createdAt: today.subtract(20, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Penarikan simpanan" },
    { id_anggota: null, jenis: "penarikan", jumlah: -150_000, createdAt: today.subtract(7, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Penarikan infaq" },
    { id_anggota: null, jenis: "penarikan", jumlah: -100_000, createdAt: today.subtract(5, "day").format("YYYY-MM-DD HH:mm:ss"), keterangan: "Penarikan sukarela" },
  );

  // ─── Transaksi (audit log) ──────────────────────────────────
  await knex("transaksi").insert(transaksiRows);

  // ─── Events ─────────────────────────────────────────────────
  await knex("events").insert([
    {
      title: "Rapat Anggota Tahunan",
      description: "RAT pembahasan laporan keuangan dan pemilihan pengurus.",
      tanggal: today.add(7, "day").format("YYYY-MM-DD"),
      waktu: "09:00 - 12:00 WIB",
      location: "Aula Koperasi",
      kategori: "musyawarah",
    },
    {
      title: "Pelatihan UMKM",
      description: "Workshop pengelolaan keuangan UMKM untuk anggota.",
      tanggal: today.add(21, "day").format("YYYY-MM-DD"),
      waktu: "13:00 - 16:00 WIB",
      location: "Ruang Serbaguna",
      kategori: "pelatihan",
    },
    {
      title: "Silaturahmi Keluarga Koperasi",
      description: "Acara kumpul keluarga anggota koperasi.",
      tanggal: today.add(45, "day").format("YYYY-MM-DD"),
      waktu: "08:00 - 13:00 WIB",
      location: "Taman Kota",
      kategori: "silaturahmi",
    },
  ]);
}
