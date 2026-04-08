# Struktur Sheet Google Spreadsheet Tahap 1

Dokumen ini mengikuti keputusan struktur sheet MVP Sales Order tahap 1 yang sudah disepakati.

## Prinsip
- fokus ke operasional Sales Order MVP
- nama sheet dibuat jelas dan mudah dikenali user non-teknis
- kolom dibuat sesingkat mungkin, tapi cukup untuk proses order, approval, kirim, dan cetak surat jalan
- tahap ini belum memisahkan detail item ke tabel terpisah agar implementasi awal tetap sederhana

## Sheet Wajib

### 1. `MASTER_CUSTOMER`
Fungsi: database customer lama dan customer baru.

Kolom:
- `kode_customer`
- `nama_customer`
- `tipe_customer`
- `kategori_customer`
- `alamat`
- `pic`
- `no_hp`
- `latitude`
- `longitude`
- `status_customer`
- `status_pembayaran`
- `limit_tunggakan`
- `catatan`

### 2. `MASTER_USER`
Fungsi: daftar user yang memakai sistem.

Kolom:
- `user_id`
- `nama_user`
- `role`
- `no_hp`
- `email`
- `status_aktif`

Role utama:
- `Sales`
- `CS/Admin`
- `Approver`

### 3. `SALES_ORDER`
Fungsi: sheet transaksi order utama.

Kolom:
- `no_so`
- `tanggal_order`
- `jam_order`
- `sales_id`
- `sales_nama`
- `jenis_customer`
- `customer_id`
- `nama_customer_input`
- `alamat_kirim`
- `pic_customer`
- `no_hp_customer`
- `item`
- `qty`
- `harga`
- `diskon`
- `subtotal`
- `total`
- `term_pembayaran`
- `status_pembayaran_customer`
- `status_order`
- `prioritas_kirim`
- `tanggal_kirim_rencana`
- `catatan`
- `butuh_persetujuan`
- `alasan_hold`

Catatan:
- untuk tahap awal, `item` masih satu kolom agar implementasi cepat
- jika nanti order multi-item makin sering, baru dipisah ke tabel detail

### 4. `APPROVAL_ORDER`
Fungsi: menampung order yang tertahan karena tunggakan atau pengecualian operasional.

Kolom:
- `approval_id`
- `no_so`
- `tanggal_pengajuan`
- `diajukan_oleh`
- `alasan_approval`
- `status_approval`
- `diputuskan_oleh`
- `tanggal_keputusan`
- `catatan_approval`

Status approval:
- `Menunggu`
- `Disetujui`
- `Ditolak`

### 5. `SURAT_JALAN`
Fungsi: data surat jalan dari SO yang sudah lolos proses.

Kolom:
- `no_surat_jalan`
- `no_so`
- `tanggal_cetak`
- `tanggal_kirim`
- `customer_id`
- `nama_customer`
- `alamat_kirim`
- `item`
- `qty`
- `driver`
- `armada`
- `status_kirim`
- `catatan_kirim`

## Sheet Tambahan

### 6. `LOG_STATUS_ORDER`
Fungsi: riwayat perubahan status order.

Kolom:
- `log_id`
- `no_so`
- `tanggal`
- `jam`
- `status_lama`
- `status_baru`
- `diubah_oleh`
- `catatan`

### 7. `MASTER_ITEM`
Fungsi: referensi item jika nanti ingin dropdown item lebih rapi.

Kolom:
- `kode_item`
- `nama_item`
- `satuan`
- `harga_default`
- `status_aktif`

### 8. `MASTER_STATUS`
Fungsi: sumber dropdown dan label agar penulisan status seragam.

Kolom:
- `kategori`
- `kode`
- `label`
- `urutan`
- `status_aktif`

## Urutan Proses Data

Alur utama:
`MASTER_CUSTOMER` -> `SALES_ORDER` -> `APPROVAL_ORDER` -> `SURAT_JALAN`

Riwayat status dicatat di:
`LOG_STATUS_ORDER`

## Implementasi Apps Script Saat Ini

Script setup spreadsheet sudah mengikuti struktur ini:
- membuat 5 sheet wajib
- membuat 3 sheet tambahan
- mengisi awal `MASTER_STATUS` untuk role, status customer, status approval, status order, prioritas kirim, dan jenis customer

## Keputusan MVP
- kita pakai satu sheet `SALES_ORDER` dulu agar implementasi tahap awal lebih cepat
- relasi dibuat ringan, berbasis `no_so`, `customer_id`, dan `user_id`
- normalisasi data yang lebih detail bisa dilakukan setelah alur operasional terbukti stabil

## Dokumen Lanjutan
- relasi antar sheet dan flow status final mengacu ke [03-relasi-dan-flow-status.md](/F:/AIRTIS/SALES%20MANAGEMENT/docs/03-relasi-dan-flow-status.md)
