# Automated Data Collection & Cleansing (Cron Job)

Otomatisasi untuk melakukan pengumpulan (*collection*) data secara terjadwal dari server API backend dan melakukan pembersihan (*cleansing*) berkas-berkas log data yang sudah kadaluarsa (lebih dari 30 hari).

## Fitur Utama

- **Pengumpulan Data Otomatis**: Menyediakan skrip JavaScript (`collect.js`), Linux Bash (`collect.sh`), dan Windows PowerShell (`collect.ps1`) untuk menarik data dari API dan mengubahnya menjadi format CSV.
- **Penyimpanan Berkas**: Menyimpan berkas di path `/home/cron` (Linux) atau `C:\home\cron` (Windows) dengan format penamaan `cron_{date}_{hours}` (contoh: `cron_12192024_15.00.csv`).
- **Fallback Offline Database**: Jika server backend offline atau tidak terjangkau, skrip akan menduplikasi berkas database `data.csv` dari folder root project sebagai cadangan.
- **Data Kadaluarsa**: Mendeteksi dan menghapus berkas log lama yang sudah berusia lebih dari 30 hari secara otomatis menggunakan skrip JavaScript (`cleanup.js`), Bash (`cleanup.sh`), dan PowerShell (`cleanup.ps1`).
- **Penjadwalan**: Berjalan 3 kali sehari (08.00 WIB, 12.00 WIB, dan 15.00 WIB) serta setiap 3 jam untuk pengumpulan data, dan setiap hari pada pukul 00.00 WIB untuk pembersihan data.

---

## Petunjuk Penggunaan

### 1. Instalasi Dependensi
Pastikan Node.js sudah terinstal di komputer Anda. Buka terminal di dalam folder `task_2_cron` ini dan jalankan command:
```bash
npm install
```

### 2. Menjalankan Scheduler (Node.js Daemon)
Jalankan daemon penjadwalan menggunakan Node.js untuk mengeksekusi cron job secara cross-platform:
```bash
npm start
```

### 3. Konfigurasi Penjadwalan Native OS

#### A. Linux (Crontab)
Buka crontab editor menggunakan perintah `crontab -e` dan tambahkan baris berikut untuk menjalankan skrip bash secara berkala:
```bash
# Pengumpulan data pada jam 08:00, 12:00, dan 15:00
0 8,12,15 * * * /bin/bash /path/to/task_2_cron/collect.sh

# Pengumpulan data cadangan setiap 3 jam sekali
0 */3 * * * /bin/bash /path/to/task_2_cron/collect.sh

# Pembersihan data kadaluarsa sekali sehari pada tengah malam
0 0 * * * /bin/bash /path/to/task_2_cron/cleanup.sh
```

#### B. Windows (Task Scheduler)
1. Buka **Task Scheduler** di Windows dan buat tugas baru (*Create Basic Task*).
2. Set waktu pemicu (*Trigger*) harian pada jam 08:00, 12:00, 15:00, atau setiap 3 jam.
3. Atur aksi (*Action*) berupa **Start a Program**.
4. Isi kotak program dengan `powershell.exe`.
5. Isi kotak parameter (*Arguments*) dengan:
   ```text
   -ExecutionPolicy Bypass -File "C:\path\to\task_2_cron\collect.ps1"
   ```
6. Buat tugas serupa untuk melakukan pembersihan harian menggunakan `cleanup.ps1`.

### 4. Menjalankan Pengujian Otomatis
Kami menyediakan skrip pengujian integrasi terisolasi untuk memverifikasi fungsionalitas skrip JS dan PowerShell tanpa mengganggu database produksi Anda:
```bash
npm test
```
