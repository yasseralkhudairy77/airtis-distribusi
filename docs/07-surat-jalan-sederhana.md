# Tahap 1E - Surat Jalan Sederhana

Tahap ini menambahkan backend pembuatan surat jalan dari order yang sudah `Siap Kirim`.

## Tujuan
- membuat nomor surat jalan otomatis
- mengambil data dari `SALES_ORDER`
- menyimpan surat jalan ke `SURAT_JALAN`
- mencegah surat jalan dibuat untuk order yang belum valid
- mencegah duplikasi surat jalan untuk satu `no_so`

## File Apps Script yang dipakai
- `SalesOrderService.gs`
- `ApprovalService.gs`
- `DeliveryService.gs`

## Function utama

### `createSuratJalan(noSo, options)`
Membuat surat jalan dari `no_so` yang statusnya `Siap Kirim`.

Data yang disimpan:
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

## Function test

### `testCreateSuratJalanFromLatestReadyOrder()`
Mengambil order terakhir yang statusnya `Siap Kirim`, lalu membuat surat jalan.

### `testCreateSuratJalanByNoSo()`
Membuat surat jalan berdasarkan `no_so` tertentu. Nilai `ISI_NO_SO_DI_SINI` harus diganti dulu.

## Rule yang dipakai
- surat jalan hanya boleh dibuat jika `status_order = Siap Kirim`
- satu `no_so` hanya boleh punya satu surat jalan di MVP
- tahap ini belum mengubah status order menjadi `Terkirim`

## Hasil yang diharapkan
- 1 baris baru masuk ke `SURAT_JALAN`
- data customer dan item diambil dari `SALES_ORDER`
- nomor surat jalan otomatis terbentuk dengan prefix `SJ`

## Catatan MVP
- tahap ini baru backend data surat jalan
- belum masuk layout print Epson LX
- update status kirim `Terkirim` dan `Selesai` bisa dibuat setelah ini
