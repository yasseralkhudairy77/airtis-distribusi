# Perencanaan Sistem MVP Sales Order

> Catatan pembaruan:
> Struktur sheet tahap 1 yang aktif sekarang mengikuti dokumen [02-struktur-sheet-tahap-1.md](/F:/AIRTIS/SALES%20MANAGEMENT/docs/02-struktur-sheet-tahap-1.md).
> Dokumen ini tetap berguna untuk konteks bisnis, arsitektur, flow user, dan urutan implementasi.

## 1. Ringkasan Pemahaman Sistem

MVP ini ditujukan untuk operasional distribusi air minum dalam kemasan dengan tiga peran utama:
- Sales: input order dari HP
- CS/Admin: verifikasi order, proses order, cetak surat jalan, update status kirim
- Approver: menyetujui atau menolak order yang bermasalah karena tunggakan

Fokus tahap 1 hanya pada proses inti operasional:
- master customer
- input sales order
- approval tunggakan
- status pengiriman dasar
- cetak surat jalan

Sistem tidak sedang dibangun untuk menjadi ERP lengkap. Karena itu, desain harus:
- sederhana
- murah dijalankan
- mudah dirawat
- cepat dipakai tim lapangan dan admin
- tidak bergantung pada infrastruktur mahal

Inti rule bisnis yang harus dijaga:
- Sales Order bisa dibuat untuk customer lama atau customer baru
- Customer lama harus dicek status pembayarannya
- Jika customer menunggak, order tidak boleh lanjut otomatis
- Order menunggak masuk ke status `Menunggu Persetujuan`
- Approver bisa approve atau reject
- Order H-1 wajib dikirim hari H
- Order hari H hanya ditandai sebagai opsional kirim hari ini, belum ada optimasi rute otomatis
- Surat jalan harus bisa dicetak dari webapp dengan format yang cocok untuk printer Epson LX / dot matrix / continuous form

## 2. Arsitektur Solusi

Arsitektur yang paling realistis untuk MVP ini:

### 2.1 Komponen
- Google Sheets: database awal dan tempat konfigurasi sederhana
- Google Apps Script: backend, business logic, dan web app
- HTML/CSS/JavaScript sederhana di Apps Script: UI untuk sales, admin, dan approver

### 2.2 Alasan pilihan ini
- biaya sangat rendah
- implementasi cepat
- mudah dipahami tim kecil
- cukup untuk volume awal MVP
- mudah diubah sambil belajar dari operasional nyata

### 2.3 Arsitektur logis
1. User membuka web app
2. Form menyesuaikan peran pengguna
3. Apps Script membaca/menulis data ke Google Sheets
4. Logic approval, status order, dan pembuatan surat jalan dijalankan di Apps Script
5. Halaman print surat jalan dibuka dari web app dengan stylesheet khusus printer dot matrix

### 2.4 Batasan yang diterima sejak awal
- belum ada database relasional penuh
- validasi masih berbasis Apps Script dan aturan sheet
- belum ada routing otomatis
- item order untuk tahap awal bisa dibuat sederhana dulu
- print dioptimalkan untuk layout operasional, bukan desain dokumen formal modern

## 3. Sheet / Tabel yang Dibutuhkan

Untuk MVP tahap 1, sheet minimal yang disarankan:

1. `Users`
2. `Customers`
3. `SalesOrders`
4. `SalesOrderItems`
5. `Approvals`
6. `DeliveryOrders`
7. `Config`
8. `Logs` (opsional tapi sangat disarankan)

### 3.1 Fungsi tiap sheet

#### `Users`
Menyimpan data user yang boleh mengakses sistem dan perannya.

#### `Customers`
Master customer lama dan customer baru yang sudah tersimpan.

#### `SalesOrders`
Header order penjualan. Satu baris mewakili satu nomor SO.

#### `SalesOrderItems`
Detail item per order. Dipisah supaya order bisa punya lebih dari satu item tanpa membuat sheet header menjadi sulit dikelola.

#### `Approvals`
Mencatat pengajuan approval untuk order yang perlu persetujuan.

#### `DeliveryOrders`
Mencatat data surat jalan dan status kirim dasar.

#### `Config`
Menyimpan data referensi ringan seperti daftar term pembayaran, status, prefix nomor dokumen, dan parameter print.

#### `Logs`
Menyimpan jejak aktivitas penting seperti submit order, approval, reject, cetak surat jalan, dan perubahan status.

## 4. Definisi Field Tiap Sheet

## 4.1 Sheet `Users`
Field minimal:
- `user_id`
- `nama_user`
- `email`
- `role`
- `aktif`
- `no_hp`
- `created_at`
- `updated_at`

Catatan:
- `role`: `Sales`, `CS/Admin`, `Approver`
- login awal paling hemat biaya bisa memakai email Google yang diizinkan

## 4.2 Sheet `Customers`
Field minimal:
- `customer_id`
- `kode_customer`
- `nama_customer`
- `tipe_customer`
- `alamat`
- `pic`
- `no_hp`
- `latitude`
- `longitude`
- `status_customer`
- `status_pembayaran`
- `term_pembayaran_default`
- `area_pengiriman`
- `catatan_customer`
- `created_at`
- `updated_at`

Catatan:
- `status_customer`: `Baru`, `Aktif`, `Menunggak`, `Ditahan`
- `status_pembayaran`: untuk MVP cukup `Lancar`, `Menunggak`
- customer baru dari order bisa masuk dulu dengan status `Baru`, lalu dirapikan admin

## 4.3 Sheet `SalesOrders`
Field minimal:
- `so_id`
- `no_so`
- `tanggal_order`
- `tanggal_kirim_rencana`
- `sales_user_id`
- `sales_nama`
- `jenis_customer`
- `customer_id`
- `nama_customer_input`
- `alamat_kirim`
- `pic_kirim`
- `no_hp_kirim`
- `term_pembayaran`
- `status_customer_snapshot`
- `status_pembayaran_snapshot`
- `butuh_approval`
- `status_order`
- `prioritas_kirim`
- `catatan`
- `subtotal`
- `diskon_total`
- `total`
- `created_at`
- `updated_at`

Catatan:
- `jenis_customer`: `Lama`, `Baru`
- snapshot disimpan supaya histori order tidak berubah kalau master customer berubah setelahnya
- `prioritas_kirim` untuk MVP cukup: `H-1 Wajib`, `Same Day Opsional`, `Jadwal Biasa`

## 4.4 Sheet `SalesOrderItems`
Field minimal:
- `so_item_id`
- `so_id`
- `no_so`
- `kode_item`
- `nama_item`
- `qty`
- `harga`
- `diskon`
- `subtotal`
- `catatan_item`

Catatan:
- karena scope belum mencakup inventory detail, master item bisa sederhana dulu atau bahkan sementara dikelola dari `Config`
- jika saat ini hanya ada sedikit SKU utama, pendekatan sederhana jauh lebih aman untuk MVP

## 4.5 Sheet `Approvals`
Field minimal:
- `approval_id`
- `no_so`
- `so_id`
- `alasan_approval`
- `diajukan_oleh`
- `diajukan_pada`
- `diputuskan_oleh`
- `status_approval`
- `waktu_approval`
- `catatan_approval`

Catatan:
- `status_approval`: `Menunggu`, `Disetujui`, `Ditolak`
- alasan approval untuk MVP umumnya: `Customer menunggak`

## 4.6 Sheet `DeliveryOrders`
Field minimal:
- `delivery_id`
- `no_surat_jalan`
- `no_so`
- `so_id`
- `tanggal_surat_jalan`
- `tanggal_kirim`
- `status_pengiriman`
- `tipe_pengiriman`
- `nama_customer`
- `alamat_kirim`
- `catatan_pengiriman`
- `printed_at`
- `printed_by`
- `created_at`
- `updated_at`

Catatan:
- `status_pengiriman`: `Siap Kirim`, `Terkirim`, `Selesai`
- `tipe_pengiriman`: `H-1`, `Same Day`, `Terjadwal`

## 4.7 Sheet `Config`
Field yang disarankan:
- `config_group`
- `config_key`
- `config_value`
- `aktif`
- `keterangan`

Contoh isi:
- prefix nomor SO
- prefix surat jalan
- daftar status order
- daftar term pembayaran
- tinggi baris print
- jumlah copy cetak

## 4.8 Sheet `Logs`
Field minimal:
- `log_id`
- `waktu`
- `user`
- `aksi`
- `ref_type`
- `ref_no`
- `detail`

## 5. Flow Status

## 5.1 Flow status order
Urutan status order yang disarankan:

1. `Draft`
2. `Menunggu Persetujuan`
3. `Disetujui`
4. `Ditolak`
5. `Siap Kirim`
6. `Terkirim`
7. `Selesai`

### Aturan transisi
- Order baru disimpan sementara: `Draft`
- Jika customer aman dan data valid saat submit: langsung ke `Disetujui` atau `Siap Kirim`
- Untuk MVP lebih aman gunakan alur:
  - tanpa masalah pembayaran: `Draft` -> `Disetujui` -> `Siap Kirim`
  - dengan tunggakan: `Draft` -> `Menunggu Persetujuan`
- Jika approver setuju: `Menunggu Persetujuan` -> `Disetujui`
- Jika approver tolak: `Menunggu Persetujuan` -> `Ditolak`
- Setelah order siap diproses admin: `Disetujui` -> `Siap Kirim`
- Setelah barang dikirim: `Siap Kirim` -> `Terkirim`
- Setelah proses selesai administratif: `Terkirim` -> `Selesai`

### Rekomendasi praktis MVP
Gunakan rule sederhana ini dulu:
- order lolos kredit: setelah submit langsung `Siap Kirim`
- order perlu approval: `Menunggu Persetujuan`
- order ditolak: `Ditolak`
- order selesai kirim: `Terkirim` lalu `Selesai`

Ini lebih hemat klik untuk tim operasional.

## 5.2 Flow status customer
Status customer dipakai sebagai sinyal operasional, bukan analisa kompleks:
- `Baru`: customer baru atau belum aktif penuh
- `Aktif`: customer aktif dan bisa order normal
- `Menunggak`: ada tunggakan, order perlu approval
- `Ditahan`: order tidak boleh diproses normal, butuh keputusan manual

## 5.3 Flow status approval
- `Menunggu`
- `Disetujui`
- `Ditolak`

## 6. Flow User

## 6.1 Flow Sales
1. Buka form order dari HP
2. Pilih jenis customer: `Lama` atau `Baru`
3. Jika `Lama`:
   - pilih customer dari database
   - sistem tampilkan status customer dan status pembayaran
4. Jika `Baru`:
   - input nama customer dan alamat kirim manual
5. Isi item order, qty, harga, catatan, dan tanggal kirim
6. Submit order
7. Sistem menentukan hasil:
   - jika aman: order masuk `Siap Kirim`
   - jika menunggak: order masuk `Menunggu Persetujuan`
8. Sales bisa melihat status order terakhirnya

## 6.2 Flow CS/Admin
1. Buka daftar order masuk
2. Filter berdasarkan status
3. Verifikasi data order
4. Untuk order yang sudah lolos approval atau tidak butuh approval:
   - proses menjadi `Siap Kirim`
   - buat surat jalan
5. Cetak surat jalan dari webapp
6. Update status menjadi `Terkirim`
7. Tutup order menjadi `Selesai` bila administrasi selesai

## 6.3 Flow Approver
1. Buka daftar order dengan status `Menunggu Persetujuan`
2. Lihat ringkasan customer, tunggakan, dan nilai order
3. Beri keputusan:
   - `Setujui`
   - `Tolak`
4. Tambahkan catatan approval bila perlu
5. Sistem update status approval dan status order

## 7. Struktur Folder / File Project

Struktur awal yang disarankan:

```text
SALES MANAGEMENT/
  AGENTS.md
  docs/
    01-perencanaan-sistem.md
  apps-script/
    appsscript.json
    Code.gs
    Config.gs
    Auth.gs
    CustomerService.gs
    SalesOrderService.gs
    ApprovalService.gs
    DeliveryService.gs
    PrintService.gs
    Utils.gs
    templates/
      layout.html
      sales-order-form.html
      admin-dashboard.html
      approval-dashboard.html
      surat-jalan-print.html
    styles/
      main.css.html
      print-lx.css.html
    scripts/
      main.js.html
      sales-order.js.html
      admin.js.html
      approval.js.html
      print.js.html
```

### Penjelasan singkat
- `Code.gs`: entry point web app dan router sederhana
- `Config.gs`: konstanta sheet name, status, prefix dokumen
- `Auth.gs`: helper identifikasi user dan role
- `CustomerService.gs`: logic customer
- `SalesOrderService.gs`: create/read/update order dan validasi tunggakan
- `ApprovalService.gs`: proses approval/reject
- `DeliveryService.gs`: surat jalan dan update pengiriman
- `PrintService.gs`: render cetak surat jalan Epson LX
- `Utils.gs`: helper nomor dokumen, format tanggal, response
- `templates/`: halaman UI
- `styles/print-lx.css.html`: stylesheet khusus printer dot matrix

## 8. Rencana Implementasi Tahap Awal

Agar tetap sesuai MVP dan tidak keburu kompleks, implementasi dibagi seperti ini:

### Tahap 1A - Fondasi data dan konfigurasi
Bangun dulu:
- struktur Google Sheet
- header setiap sheet
- file Apps Script dasar
- konfigurasi nama sheet dan status
- helper baca/tulis sheet

Output tahap ini:
- spreadsheet siap dipakai
- project Apps Script punya pondasi yang rapi

### Tahap 1B - Master Customer
Bangun:
- CRUD customer sederhana
- pencarian customer lama
- validasi status customer

Output tahap ini:
- admin bisa mengelola customer
- sales bisa memilih customer lama

### Tahap 1C - Input Sales Order
Bangun:
- form order mobile-friendly
- pilihan customer lama / baru
- simpan header dan item order
- cek status pembayaran customer
- otomatis tandai perlu approval jika menunggak

Output tahap ini:
- sales sudah bisa input order nyata

### Tahap 1D - Approval
Bangun:
- daftar order menunggu persetujuan
- tombol approve / reject
- update status order dan approval

Output tahap ini:
- alur blokir tunggakan berjalan

### Tahap 1E - Surat Jalan dan Status Kirim
Bangun:
- buat surat jalan dari order yang valid
- print layout Epson LX
- update status `Siap Kirim`, `Terkirim`, `Selesai`

Output tahap ini:
- proses operasional dasar berjalan end-to-end

## 9. Keputusan Desain Penting

Keputusan MVP yang saya sarankan:

1. Pisahkan `SalesOrders` dan `SalesOrderItems`
Alasannya supaya order multi item tetap rapi dan tidak menyulitkan saat cetak surat jalan.

2. Simpan snapshot status customer pada order
Alasannya supaya histori keputusan approval tetap jelas walau master customer berubah.

3. Same day belum dioptimasi otomatis
Untuk MVP cukup tandai `Same Day Opsional` agar admin yang memutuskan secara manual.

4. Surat jalan dibuat dari order yang sudah valid
Ini mencegah surat jalan tercetak untuk order yang belum lolos aturan bisnis.

5. Gunakan role sederhana, bukan permission matrix rumit
Karena user hanya tiga kelompok utama.

## 10. Risiko dan Antisipasi

Risiko awal yang perlu kita sadari:

1. Google Sheets bisa berantakan jika terlalu banyak edit manual
Antisipasi: batasi edit langsung, utamakan lewat web app.

2. Data customer baru bisa tidak konsisten
Antisipasi: customer baru diberi status `Baru` dan dirapikan admin.

3. Layout print Epson LX perlu uji fisik
Antisipasi: siapkan template print khusus dan iterasi setelah tes printer nyata.

4. Approval bisa terlambat jika approver tidak aktif memantau
Antisipasi: buat daftar approval yang sangat sederhana dan jelas lebih dulu.

## 11. Rekomendasi Tahap Berikutnya

Setelah dokumen ini disepakati, tahap implementasi pertama yang paling aman adalah:
- membuat struktur folder `apps-script`
- membuat file dasar Apps Script
- membuat definisi nama sheet dan header kolom
- menyiapkan script inisialisasi spreadsheet

Dengan begitu kita belum langsung membangun semua UI, tetapi fondasi data dan logic inti sudah siap.
