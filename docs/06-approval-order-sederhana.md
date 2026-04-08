# Tahap 1D - Approval Order Sederhana

Tahap ini menambahkan proses approve dan reject untuk order yang masuk ke `APPROVAL_ORDER`.

## Tujuan
- approver bisa memutuskan order yang tertahan
- status approval di `APPROVAL_ORDER` diperbarui
- status order di `SALES_ORDER` ikut diperbarui
- perubahan status dicatat ke `LOG_STATUS_ORDER`

## File Apps Script yang dipakai
- `Utils.gs`
- `SalesOrderService.gs`
- `ApprovalService.gs`

## Function utama

### `approveOrder(noSo, approverId, catatanApproval)`
Hasil:
- `APPROVAL_ORDER.status_approval = Disetujui`
- `SALES_ORDER.status_order = Siap Kirim`

### `rejectOrder(noSo, approverId, catatanApproval)`
Hasil:
- `APPROVAL_ORDER.status_approval = Ditolak`
- `SALES_ORDER.status_order = Ditolak`

## Function test

### `testApproveLatestWaitingOrder()`
Mengambil approval terakhir dengan status `Menunggu`, lalu meng-approve.

### `testRejectLatestWaitingOrder()`
Mengambil approval terakhir dengan status `Menunggu`, lalu me-reject.

## Hasil yang diharapkan saat approve
- `APPROVAL_ORDER` baris terkait berubah menjadi `Disetujui`
- `SALES_ORDER` baris terkait berubah menjadi `Siap Kirim`
- `LOG_STATUS_ORDER` bertambah 1 baris

## Hasil yang diharapkan saat reject
- `APPROVAL_ORDER` baris terkait berubah menjadi `Ditolak`
- `SALES_ORDER` baris terkait berubah menjadi `Ditolak`
- `LOG_STATUS_ORDER` bertambah 1 baris

## Catatan MVP
- approver di test menggunakan `U003`
- tahap ini belum ada UI approval, masih lewat function test
- untuk menguji approve dan reject, siapkan dulu order hold dari `testSubmitSalesOrderHold()`
