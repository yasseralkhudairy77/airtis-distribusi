# Tahap 1B - Modul Master Customer

Modul ini adalah langkah implementasi pertama setelah struktur sheet siap.

## Tujuan
- membaca data customer dari `MASTER_CUSTOMER`
- mengambil detail customer berdasarkan `kode_customer`
- mengecek apakah customer boleh lanjut order normal atau harus masuk approval

## File Apps Script yang dipakai
- `Utils.gs`
- `CustomerService.gs`

## Function utama

### `getCustomers()`
Mengambil semua customer dari `MASTER_CUSTOMER`.

### `getActiveCustomers()`
Mengambil customer yang tidak berstatus `Ditahan`.

### `getCustomerByCode(kodeCustomer)`
Mengambil detail customer berdasarkan `kode_customer`.

### `checkCustomerEligibility(kodeCustomer)`
Mengecek apakah customer:
- boleh order normal
- perlu persetujuan
- harus di-hold

Output utama function ini:
- `found`
- `eligible`
- `butuh_persetujuan`
- `alasan_hold`
- `customer`

## Rule yang dipakai
Customer dianggap butuh hold jika:
- `status_customer = Menunggak`
- `status_customer = Ditahan`
- `status_pembayaran = Menunggak`

Hasil yang dikembalikan:
- jika aman: `butuh_persetujuan = Tidak`
- jika bermasalah: `butuh_persetujuan = Ya`

## Function test
Untuk uji awal di Apps Script:
- `testGetCustomers()`
- `testCheckCustomerEligibility()`

## Cara test di Apps Script
1. Buat file `CustomerService.gs`
2. Paste isi file lokal ke Apps Script
3. Update `Utils.gs` sesuai versi terbaru
4. Jalankan `testGetCustomers`
5. Jalankan `testCheckCustomerEligibility`
6. Buka `Execution log` untuk melihat hasil

## Hasil test yang diharapkan
- `CUST001` -> eligible, tidak butuh persetujuan
- `CUST002` -> tidak eligible, butuh persetujuan, alasan `Customer menunggak`
- `CUST003` -> eligible, tidak butuh persetujuan

## Catatan MVP
Untuk tahap ini kita belum membuat form UI customer.
Fokusnya baru pada logic backend yang nanti dipakai oleh form Sales Order.
