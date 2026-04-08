# Relasi Antar Sheet dan Flow Status MVP

Dokumen ini menetapkan relasi data dan flow status final yang dipakai untuk implementasi tahap berikutnya.

## 1. Prinsip Relasi

Untuk MVP ini, relasi dibuat sederhana dan praktis.
Kita tidak membuat relasi database yang rumit, tetapi memakai kunci referensi yang jelas agar tetap mudah dilacak.

Kunci utama yang dipakai:
- `kode_customer` untuk referensi customer
- `user_id` untuk referensi user
- `no_so` untuk referensi sales order
- `approval_id` untuk referensi approval
- `no_surat_jalan` untuk referensi surat jalan

Prinsip penting:
- satu `SALES_ORDER` mewakili satu transaksi order
- satu `SALES_ORDER` bisa punya nol atau satu `APPROVAL_ORDER`
- satu `SALES_ORDER` bisa punya nol atau satu `SURAT_JALAN` pada tahap MVP
- setiap perubahan status order dicatat ke `LOG_STATUS_ORDER`

## 2. Relasi Antar Sheet

## 2.1 `MASTER_CUSTOMER` -> `SALES_ORDER`
Relasi:
- `MASTER_CUSTOMER.kode_customer` dipakai oleh `SALES_ORDER.customer_id`

Aturan:
- jika `jenis_customer = Lama`, maka `customer_id` wajib diisi dari `MASTER_CUSTOMER.kode_customer`
- jika `jenis_customer = Baru`, maka `customer_id` boleh kosong sementara atau diisi kode sementara saat proses berikutnya
- `nama_customer_input` tetap disimpan di `SALES_ORDER` agar histori order tidak tergantung perubahan master customer

Rekomendasi MVP:
- untuk customer baru, gunakan format kode sementara seperti `NEW-yyyymmddhhmmss` bila dibutuhkan
- admin bisa merapikan customer baru ke `MASTER_CUSTOMER` setelah order masuk

## 2.2 `MASTER_USER` -> `SALES_ORDER`
Relasi:
- `MASTER_USER.user_id` dipakai oleh `SALES_ORDER.sales_id`

Aturan:
- user dengan role `Sales` membuat order
- `sales_nama` disimpan juga di `SALES_ORDER` sebagai snapshot nama user saat transaksi dibuat

## 2.3 `SALES_ORDER` -> `APPROVAL_ORDER`
Relasi:
- `SALES_ORDER.no_so` dipakai oleh `APPROVAL_ORDER.no_so`

Aturan:
- hanya order dengan `butuh_persetujuan = Ya` yang masuk ke `APPROVAL_ORDER`
- satu `no_so` maksimal satu approval aktif di MVP ini
- `APPROVAL_ORDER.status_approval` menjadi dasar update `SALES_ORDER.status_order`

Logika utama:
- jika customer menunggak, sistem isi:
  - `butuh_persetujuan = Ya`
  - `alasan_hold = Customer menunggak`
  - `status_order = Menunggu Persetujuan`
- lalu sistem membuat baris di `APPROVAL_ORDER`

## 2.4 `SALES_ORDER` -> `SURAT_JALAN`
Relasi:
- `SALES_ORDER.no_so` dipakai oleh `SURAT_JALAN.no_so`
- `SALES_ORDER.customer_id` dipakai oleh `SURAT_JALAN.customer_id`

Aturan:
- surat jalan hanya boleh dibuat dari order yang sudah valid diproses
- pada MVP, surat jalan dibuat setelah order berstatus `Siap Kirim`
- satu `no_so` diasumsikan satu `no_surat_jalan` dulu

## 2.5 `SALES_ORDER` -> `LOG_STATUS_ORDER`
Relasi:
- `SALES_ORDER.no_so` dipakai oleh `LOG_STATUS_ORDER.no_so`

Aturan:
- setiap perubahan `status_order` harus menambah satu baris log
- log juga boleh dipakai saat ada catatan penting, walau status tidak berubah

## 2.6 `MASTER_USER` -> `APPROVAL_ORDER` dan `LOG_STATUS_ORDER`
Relasi:
- `MASTER_USER.user_id` atau `nama_user` dipakai pada:
  - `APPROVAL_ORDER.diajukan_oleh`
  - `APPROVAL_ORDER.diputuskan_oleh`
  - `LOG_STATUS_ORDER.diubah_oleh`

Rekomendasi MVP:
- untuk implementasi awal, cukup simpan `user_id`
- nama bisa ditampilkan lewat lookup saat render UI
- kalau ingin lebih praktis di tahap awal, simpan `nama_user` lebih dulu dan rapikan kemudian

## 2.7 `MASTER_STATUS` -> Semua Sheet Transaksi
`MASTER_STATUS` dipakai untuk sumber dropdown agar nilai seragam, terutama untuk:
- role
- status_customer
- status_pembayaran
- status_order
- status_approval
- prioritas_kirim
- jenis_customer
- status_kirim

## 3. Matriks Relasi Ringkas

- `MASTER_CUSTOMER.kode_customer` -> `SALES_ORDER.customer_id`
- `MASTER_USER.user_id` -> `SALES_ORDER.sales_id`
- `SALES_ORDER.no_so` -> `APPROVAL_ORDER.no_so`
- `SALES_ORDER.no_so` -> `SURAT_JALAN.no_so`
- `SALES_ORDER.no_so` -> `LOG_STATUS_ORDER.no_so`
- `SALES_ORDER.customer_id` -> `SURAT_JALAN.customer_id`
- `MASTER_USER.user_id/nama_user` -> `APPROVAL_ORDER.diajukan_oleh`
- `MASTER_USER.user_id/nama_user` -> `APPROVAL_ORDER.diputuskan_oleh`
- `MASTER_USER.user_id/nama_user` -> `LOG_STATUS_ORDER.diubah_oleh`

## 4. Flow Status Order yang Paling Pas

Flow status order yang dipakai:
- `Draft`
- `Menunggu Persetujuan`
- `Disetujui`
- `Ditolak`
- `Siap Kirim`
- `Terkirim`
- `Selesai`

Namun untuk operasional MVP, kita pakai alur praktis berikut.

## 4.1 Alur normal tanpa tunggakan
1. Sales input order
2. Sistem validasi data dasar
3. Jika customer aman:
   - `butuh_persetujuan = Tidak`
   - `status_order = Siap Kirim`
4. CS/Admin dapat langsung proses surat jalan

Kenapa langsung `Siap Kirim`:
- lebih hemat langkah
- cocok untuk MVP operasional
- tidak menambah klik yang tidak perlu

## 4.2 Alur order dengan tunggakan
1. Sales input order
2. Sistem cek `status_pembayaran_customer`
3. Jika `Menunggak`:
   - `butuh_persetujuan = Ya`
   - `alasan_hold = Customer menunggak`
   - `status_order = Menunggu Persetujuan`
4. Sistem membuat data di `APPROVAL_ORDER` dengan `status_approval = Menunggu`
5. Approver memberi keputusan

Hasil keputusan:
- jika setuju:
  - `APPROVAL_ORDER.status_approval = Disetujui`
  - `SALES_ORDER.status_order = Siap Kirim`
- jika tolak:
  - `APPROVAL_ORDER.status_approval = Ditolak`
  - `SALES_ORDER.status_order = Ditolak`

## 4.3 Alur pengiriman
Setelah order berstatus `Siap Kirim`:
1. CS/Admin buat surat jalan
2. Surat jalan dicetak
3. Saat barang berangkat atau terkirim, status order jadi `Terkirim`
4. Setelah proses operasional dianggap selesai, status order jadi `Selesai`

## 4.4 Kapan status `Disetujui` dipakai
Status `Disetujui` tetap disiapkan, tetapi untuk MVP ada dua opsi:

Opsi paling praktis:
- approval lolos langsung ubah ke `Siap Kirim`
- status `Disetujui` jarang dipakai

Opsi sedikit lebih formal:
- approval lolos ubah ke `Disetujui`
- admin ubah lagi ke `Siap Kirim`

Rekomendasi saya untuk MVP:
- pakai opsi paling praktis
- simpan `Disetujui` untuk kebutuhan nanti, tetapi alur aktif cukup langsung ke `Siap Kirim`

## 5. Flow Status Approval

Status approval yang dipakai:
- `Menunggu`
- `Disetujui`
- `Ditolak`

Transisi:
- saat order menunggak masuk: `Menunggu`
- approver setuju: `Disetujui`
- approver tolak: `Ditolak`

## 6. Flow Status Customer

Status customer:
- `Baru`
- `Aktif`
- `Menunggak`
- `Ditahan`

Aturan pakai:
- `Baru`: customer baru atau belum dirapikan penuh
- `Aktif`: customer aman untuk transaksi normal
- `Menunggak`: order wajib melewati approval
- `Ditahan`: order sebaiknya tidak lanjut otomatis dan perlu pengecekan manual

Rekomendasi MVP:
- perlakukan `Menunggak` dan `Ditahan` sama-sama sebagai kondisi hold
- bedanya, `Ditahan` bisa diberi `alasan_hold` yang lebih spesifik

## 7. Flow Prioritas Kirim

Nilai `prioritas_kirim`:
- `H-1 Wajib`
- `Same Day Opsional`
- `Jadwal Biasa`

Aturan sederhana:
- jika order masuk sehari sebelum kirim: `H-1 Wajib`
- jika order masuk di hari kirim yang sama: `Same Day Opsional`
- selain itu: `Jadwal Biasa`

Keputusan akhir tetap oleh admin, bukan sistem routing otomatis.

## 8. Rule Implementasi yang Perlu Dijaga

Saat coding nanti, rule berikut harus konsisten:

1. `customer_id` di `SALES_ORDER` mengarah ke `MASTER_CUSTOMER.kode_customer`
2. `sales_id` di `SALES_ORDER` mengarah ke `MASTER_USER.user_id`
3. `APPROVAL_ORDER` hanya dibuat jika `butuh_persetujuan = Ya`
4. `SURAT_JALAN` hanya dibuat dari order yang statusnya valid untuk kirim
5. setiap perubahan `status_order` wajib dicatat di `LOG_STATUS_ORDER`
6. nilai dropdown harus mengikuti `MASTER_STATUS`

## 9. Rekomendasi Teknis Tahap Berikutnya

Setelah relasi dan flow status ini disepakati, urutan implementasi yang paling aman adalah:
- buat helper validasi lookup sheet
- bangun modul `MASTER_CUSTOMER`
- bangun submit `SALES_ORDER`
- tambahkan logic hold dan approval
- baru lanjut ke `SURAT_JALAN`

## 10. Keputusan Final yang Dipakai Sekarang

Keputusan final untuk MVP tahap awal:
- relasi utama memakai `kode_customer`, `user_id`, dan `no_so`
- `SALES_ORDER` tetap satu sheet dulu
- order normal langsung masuk `Siap Kirim`
- order menunggak masuk `Menunggu Persetujuan`
- approval yang lolos langsung bisa diteruskan ke `Siap Kirim`
- semua perubahan status order masuk ke `LOG_STATUS_ORDER`
