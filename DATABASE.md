# Database Documentation - Koperasi App

Database: `koperasi_db` (MySQL)

## Entity Relationship Diagram

```
┌─────────────────┐
│   r_keluarga    │
├─────────────────┤
│ id_keluarga (PK)│───────┐
│ nama_kepala_    │       │
│   keluarga      │       │
│ tgl_gabung      │       │
│ created_date    │       │
│ updated_date    │       │
└─────────────────┘       │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────┐
│               r_anggota                 │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ id_keluarga (FK) ───────────────────────┘
│ nama, nik, alamat, no_telepon, email    │
│ role, tgl_gabung, status                │
│ username, password                      │
└───────────────┬─────────────────────────┘
                │
    ┌───────┬───┼───────┬──────────┬──────────┬──────────┬──────────┐
    │       │   │       │          │          │          │          │
    ▼       ▼   ▼       ▼          ▼          ▼          ▼          ▼
┌───────┐┌───────┐┌────────┐┌────────┐┌────────┐┌─────────┐┌────────┐┌────────┐
│simpan-││pinja- ││transak-││pengurus││ infaq  ││penari-  ││simpan- ││tabung- │
│an     ││man    ││si      ││        ││        ││kan      ││an_suka-││an_libu-│
│       ││       ││        ││        ││        ││(sumber) ││rela    ││ran     │
└───────┘└──┬────┘└────────┘└────────┘└────────┘└─────────┘└────────┘└────────┘
            │
            ▼
       ┌────────┐
       │cicilan │
       └────────┘
```

## Tables

### 1. r_keluarga (Keluarga/Family)

Menyimpan data keluarga sebagai unit keanggotaan koperasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id_keluarga | int(11) | NO | PK | auto_increment | ID unik keluarga |
| nama_kepala_keluarga | varchar(255) | YES | | NULL | Nama kepala keluarga |
| tgl_gabung | datetime | YES | | NULL | Tanggal bergabung |
| created_date | datetime | NO | | CURRENT_TIMESTAMP | Tanggal dibuat |
| updated_date | datetime | NO | | CURRENT_TIMESTAMP | Tanggal diupdate |

---

### 2. r_anggota (Anggota/Members)

Menyimpan data anggota koperasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik anggota |
| id_keluarga | int(11) | YES | FK | NULL | Referensi ke keluarga |
| nama | varchar(100) | NO | | NULL | Nama lengkap |
| nik | varchar(50) | YES | | NULL | Nomor Induk Kependudukan |
| alamat | text | YES | | NULL | Alamat lengkap |
| no_telepon | varchar(15) | YES | | NULL | Nomor telepon |
| email | varchar(100) | YES | | NULL | Alamat email |
| role | enum('pengurus','anggota') | YES | | 'anggota' | Role keanggotaan |
| tgl_gabung | datetime | YES | | CURRENT_TIMESTAMP | Tanggal bergabung |
| status | enum('aktif','non-aktif') | NO | | NULL | Status keanggotaan |
| username | varchar(50) | YES | UNI | NULL | Username untuk login |
| password | varchar(255) | YES | | NULL | Password (hashed) |

**Foreign Keys:**
- `id_keluarga` → `r_keluarga.id_keluarga`

---

### 3. simpanan (Savings)

Menyimpan catatan simpanan bulanan anggota.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik simpanan |
| id_anggota | int(11) | NO | FK | NULL | Referensi ke anggota |
| jumlah | decimal(15,2) | NO | | NULL | Jumlah simpanan |
| tanggal | datetime | NO | | CURRENT_TIMESTAMP | Tanggal simpanan |
| bulan | varchar(2) | YES | | NULL | Bulan simpanan (01-12) |
| tahun | varchar(4) | YES | | NULL | Tahun simpanan |
| metode_pembayaran | enum('transfer','tunai') | YES | | 'transfer' | Metode pembayaran |
| status | enum('pending','ditolak','diterima') | YES | | 'diterima' | Status simpanan |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

---

### 4. pinjaman (Loans)

Menyimpan data pengajuan pinjaman anggota.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id_pinjaman | int(11) | NO | PK | auto_increment | ID unik pinjaman |
| id_anggota | int(11) | NO | FK | NULL | Referensi ke anggota |
| jumlah | decimal(15,2) | NO | | NULL | Jumlah pinjaman |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal pengajuan |
| status | enum('proses','lunas') | YES | | 'proses' | Status pinjaman |
| keterangan | text | YES | | NULL | Keterangan tambahan |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

**Business Rules:**
- Pinjaman maksimal 80% dari total simpanan keluarga (SUM dari tabel simpanan) dikurangi pinjaman aktif
- Status 'proses' = sedang berjalan, 'lunas' = sudah dilunasi

---

### 5. cicilan (Installments)

Menyimpan catatan pembayaran cicilan pinjaman.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id_cicilan | int(11) | NO | PK | auto_increment | ID unik cicilan |
| id_pinjaman | int(11) | NO | FK | NULL | Referensi ke pinjaman |
| jumlah | decimal(15,2) | NO | | NULL | Jumlah cicilan |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal pembayaran |

**Foreign Keys:**
- `id_pinjaman` → `pinjaman.id_pinjaman`

**Business Rules:**
- Cicilan tidak boleh melebihi sisa pinjaman
- Pinjaman otomatis 'lunas' jika total cicilan = jumlah pinjaman

---

### 6. transaksi (Transactions)

Log semua transaksi keuangan anggota.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik transaksi |
| id_anggota | int(11) | NO | FK | NULL | Referensi ke anggota |
| jenis | enum('simpanan','cicilan','pinjaman','lainnya') | NO | | NULL | Jenis transaksi |
| jumlah | decimal(15,2) | NO | | NULL | Jumlah transaksi |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal transaksi |
| keterangan | text | YES | | NULL | Keterangan |
| saldo_akhir | decimal(15,2) | YES | | NULL | Saldo setelah transaksi |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

---

### 7. pengurus (Board Members)

Menyimpan data pengurus koperasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik pengurus |
| id_anggota | int(11) | NO | FK, UNI | NULL | Referensi ke anggota |
| jabatan | varchar(50) | NO | | NULL | Jabatan pengurus |
| status | enum('aktif','non-aktif') | NO | | NULL | Status kepengurusan |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id` (UNIQUE - 1 anggota hanya 1 jabatan)

---

### 8. infaq (Donations)

Menyimpan catatan infaq/donasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik infaq |
| id_anggota | int(11) | YES | FK | NULL | Referensi ke anggota |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal infaq |
| keterangan | text | YES | | NULL | Keterangan |
| jumlah | decimal(15,2) | YES | | NULL | Jumlah infaq |
| jenis | enum('masuk','keluar') | YES | | 'masuk' | Jenis infaq |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

---

### 9. penarikan (Withdrawals)

Menyimpan catatan penarikan dari berbagai sumber dana. Penarikan simpanan & liburan untuk pribadi anggota, penarikan sukarela & infaq untuk kebutuhan koperasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik penarikan |
| jumlah | decimal(10,0) | NO | | NULL | Jumlah penarikan |
| id_anggota | int(11) | NO | FK | NULL | Referensi ke anggota |
| tanggal | datetime | YES | | CURRENT_TIMESTAMP | Tanggal penarikan |
| tahun | varchar(6) | YES | | NULL | Tahun penarikan |
| sumber | enum('simpanan','sukarela','infaq','liburan') | NO | | 'simpanan' | Sumber dana penarikan |
| keterangan | text | YES | | NULL | Keterangan penarikan |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

**Business Rules:**
- Sumber `simpanan` & `liburan` → penarikan untuk pribadi anggota
- Sumber `sukarela` & `infaq` → penarikan untuk kebutuhan koperasi
- Tidak ada approval, langsung diproses

---

### 10. simpanan_sukarela (Voluntary Savings)

Menyimpan catatan kontribusi sukarela anggota. Dana dapat ditarik untuk kebutuhan koperasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik simpanan sukarela |
| id_anggota | int(11) | NO | FK | NULL | Referensi ke anggota |
| jumlah | decimal(15,2) | NO | | NULL | Jumlah kontribusi |
| tanggal | datetime | NO | | CURRENT_TIMESTAMP | Tanggal kontribusi |
| keterangan | text | YES | | NULL | Keterangan |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal dibuat |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

**Business Rules:**
- Tidak dihitung dalam batas 80% pinjaman keluarga
- Penarikan melalui tabel `penarikan` dengan sumber='sukarela'

---

### 11. tabungan_liburan (Holiday Savings)

Menyimpan catatan tabungan anggota yang diperuntukan untuk liburan.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik tabungan liburan |
| id_anggota | int(11) | NO | FK | NULL | Referensi ke anggota |
| jumlah | decimal(15,2) | NO | | NULL | Jumlah setoran |
| tanggal | datetime | NO | | CURRENT_TIMESTAMP | Tanggal setoran |
| keterangan | text | YES | | NULL | Keterangan |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal dibuat |

**Foreign Keys:**
- `id_anggota` → `r_anggota.id`

**Business Rules:**
- Tidak dihitung dalam batas 80% pinjaman keluarga
- Penarikan melalui tabel `penarikan` dengan sumber='liburan'

---

## Foreign Key Summary

| Table | Column | References |
|-------|--------|------------|
| r_anggota | id_keluarga | r_keluarga.id_keluarga |
| simpanan | id_anggota | r_anggota.id |
| pinjaman | id_anggota | r_anggota.id |
| cicilan | id_pinjaman | pinjaman.id_pinjaman |
| transaksi | id_anggota | r_anggota.id |
| pengurus | id_anggota | r_anggota.id |
| infaq | id_anggota | r_anggota.id |
| penarikan | id_anggota | r_anggota.id |
| simpanan_sukarela | id_anggota | r_anggota.id |
| tabungan_liburan | id_anggota | r_anggota.id |

---

### 12. events (Events/Kegiatan)

Menyimpan data event/kegiatan koperasi.

| Column | Type | Nullable | Key | Default | Description |
|--------|------|----------|-----|---------|-------------|
| id | int(11) | NO | PK | auto_increment | ID unik event |
| title | varchar(255) | NO | | NULL | Judul event |
| description | text | YES | | NULL | Deskripsi event |
| tanggal | date | NO | | NULL | Tanggal pelaksanaan |
| waktu | varchar(100) | YES | | NULL | Waktu pelaksanaan (contoh: "09:00 - 12:00 WIB") |
| location | varchar(255) | YES | | NULL | Lokasi event |
| kategori | enum('rapat','pelatihan','sosial','silaturahmi','olahraga','pendidikan','kesehatan','keagamaan','musyawarah','penggalangan_dana') | NO | | 'rapat' | Kategori event |
| createdAt | datetime | YES | | CURRENT_TIMESTAMP | Tanggal dibuat |

---

## System Tables

| Table | Description |
|-------|-------------|
| knex_migrations | Tracking migrasi database (Knex.js) |
| knex_migrations_lock | Lock untuk migrasi |
