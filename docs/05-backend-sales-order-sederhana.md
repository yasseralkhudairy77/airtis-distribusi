# Tahap 1C - Backend Sales Order Sederhana

Tahap ini menambahkan logic submit order ke sheet `SALES_ORDER`.

## Tujuan
- membuat nomor SO otomatis
- menyimpan order ke `SALES_ORDER`
- mengecek customer lama sebelum submit
- menandai order aman atau butuh persetujuan
- otomatis membuat data di `APPROVAL_ORDER` jika order tertahan
- otomatis mencatat perubahan status ke `LOG_STATUS_ORDER`

## File Apps Script yang dipakai
- `Utils.gs`
- `CustomerService.gs`
- `SalesOrderService.gs`

## Function utama

### `submitSalesOrder(payload)`
Menerima data order lalu memproses:
- validasi field wajib
- cek jenis customer
- cek customer lama
- menentukan `status_order`
- menentukan `prioritas_kirim`
- simpan order
- buat approval bila perlu
- tulis log status

## Status hasil submit
- customer aman -> `Siap Kirim`
- customer menunggak / ditahan -> `Menunggu Persetujuan`

## Rule prioritas kirim
- kirim hari ini -> `Same Day Opsional`
- kirim besok -> `H-1 Wajib`
- selain itu -> `Jadwal Biasa`

## Function test

### `testSubmitSalesOrderAman()`
Simulasi order customer lancar.

### `testSubmitSalesOrderHold()`
Simulasi order customer menunggak.

## Hasil yang diharapkan

### Test aman
- tambah 1 baris di `SALES_ORDER`
- `status_order = Siap Kirim`
- `butuh_persetujuan = Tidak`
- tambah 1 baris di `LOG_STATUS_ORDER`
- tidak membuat baris di `APPROVAL_ORDER`

### Test hold
- tambah 1 baris di `SALES_ORDER`
- `status_order = Menunggu Persetujuan`
- `butuh_persetujuan = Ya`
- `alasan_hold = Customer menunggak`
- tambah 1 baris di `APPROVAL_ORDER`
- tambah 1 baris di `LOG_STATUS_ORDER`

## Catatan MVP
- tahap ini belum membuat form input web
- payload test masih dihardcode untuk uji backend
- customer baru saat ini dianggap aman dulu dan langsung bisa lanjut
