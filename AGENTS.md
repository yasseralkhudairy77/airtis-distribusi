# AGENTS.md

## Project
MVP Sales Order distribusi air minum dalam kemasan.

## Objective
Bangun modul Sales Order sederhana untuk operasional sales lapangan dan CS/admin dengan biaya minim.

## Main Users
- Sales
- CS/Admin
- Approver

## Scope Phase 1
- Master Customer
- Sales Order
- Approval tunggakan
- Status pengiriman dasar
- Cetak surat jalan Epson LX

## Out of Scope
- Routing otomatis penuh
- Akuntansi lengkap
- Inventory detail
- Dashboard kompleks
- ERP penuh

## Core Business Rules
1. Sales Order harus mendukung:
   - Customer lama
   - Customer baru

2. Customer lama harus dicek status pembayarannya.

3. Jika customer menunggak:
   - order tidak boleh lanjut otomatis
   - order masuk "Menunggu Persetujuan"

4. Approver dapat:
   - approve
   - reject

5. Aturan pengiriman:
   - Order H-1 = wajib kirim hari H
   - Order hari H = opsional, hanya jika searah dan tidak mengganggu rute utama

6. Surat jalan:
   - dibuat dari sales order
   - dicetak dari webapp
   - layout harus cocok untuk Epson LX / dot matrix / continuous form / sobek 2 bagian

## Preferred Tech
- Google Sheets
- Apps Script
- Web UI sederhana
- Mobile-friendly untuk sales
- Web-friendly untuk admin

## Design Principles
- sederhana
- stabil
- hemat biaya
- mudah dipakai user non-teknis
- label memakai Bahasa Indonesia
- hindari overengineering

## Required Entities
- Customer
- Sales Order
- Approval
- Surat Jalan
- User

## Customer Status
- Baru
- Aktif
- Menunggak
- Ditahan

## Order Status
- Draft
- Menunggu Persetujuan
- Disetujui
- Ditolak
- Siap Kirim
- Terkirim
- Selesai

## Development Order
1. Pahami konteks bisnis
2. Rancang struktur data
3. Rancang flow user
4. Rancang status order
5. Susun struktur file
6. Implementasi bertahap
7. Jangan langsung bangun semua fitur sekaligus

## Notes
- Fokus ke MVP operasional
- Semua keputusan harus praktis
- Routing hanya disiapkan datanya dulu, belum dioptimasi otomatis
