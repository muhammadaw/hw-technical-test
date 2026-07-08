# Huawei Assessment Project

Repositori ini berisi task backend, cron job, dan query database. Project ini dibagi menjadi tiga folder task sebagai berikut:

## Deskripsi Singkat Setiap Task

### 1. Task 1: Server Backend
Menjalankan REST API server pada port `5000` dengan endpoint utama:
- `POST /api/submit`: Menerima pengiriman data formulir tunggal maupun massal (array).
- `GET /api/submissions`: Membaca dan menampilkan seluruh data dari database CSV.

### 2. Task 2: Automated Cron & Cleansing
Menyediakan solusi otomasi cross-platform:
- **Node.js**: Menjalankan daemon scheduler via `node-cron`.
- **Linux Bash**: Skrip `.sh` untuk dipasang di sistem Crontab Linux.
- **Windows PowerShell**: Skrip `.ps1` untuk dipasang di Task Scheduler Windows.

### 3. Task 3: SQL Database Queries
Berisi inisialisasi skema tabel `employees` dan lima query SQL terpisah untuk penyelesaian logika manipulasi database.

---

## Petunjuk Menjalankan Project

Untuk informasi instalasi, menjalankan project, dan instruksi pengujian yang lebih detail, silakan baca `README.md` yang ada di masing-masing folder