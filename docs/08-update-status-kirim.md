# Tahap 1F - Update Status Kirim

Tahap ini melengkapi alur setelah surat jalan dibuat.

## Tujuan
- menandai order menjadi `Terkirim`
- menandai order menjadi `Selesai`
- menjaga `SURAT_JALAN` dan `SALES_ORDER` tetap sinkron
- mencatat perubahan ke `LOG_STATUS_ORDER`

## File Apps Script yang dipakai
- `DeliveryService.gs`
- `SalesOrderService.gs`
- `Utils.gs`

## Function utama

### `markOrderDelivered(noSo, userId, catatanKirim)`
Mengubah:
- `SURAT_JALAN.status_kirim = Terkirim`
- `SALES_ORDER.status_order = Terkirim`

### `completeOrder(noSo, userId, catatanKirim)`
Mengubah:
- `SURAT_JALAN.status_kirim = Selesai`
- `SALES_ORDER.status_order = Selesai`

## Function test

### `testMarkLatestDelivered()`
Mengambil surat jalan terakhir dengan status `Siap Kirim`, lalu mengubahnya menjadi `Terkirim`.

### `testCompleteLatestOrder()`
Mengambil surat jalan terakhir dengan status `Terkirim`, lalu mengubahnya menjadi `Selesai`.

## Hasil yang diharapkan

### Saat mark delivered
- `SURAT_JALAN.status_kirim` menjadi `Terkirim`
- `SALES_ORDER.status_order` menjadi `Terkirim`
- `LOG_STATUS_ORDER` bertambah 1 baris

### Saat complete order
- `SURAT_JALAN.status_kirim` menjadi `Selesai`
- `SALES_ORDER.status_order` menjadi `Selesai`
- `LOG_STATUS_ORDER` bertambah 1 baris

## Catatan MVP
- tahap ini masih backend
- belum ada dashboard admin atau tombol UI
- tetapi alur operasional inti dari order sampai selesai sekarang sudah lengkap
