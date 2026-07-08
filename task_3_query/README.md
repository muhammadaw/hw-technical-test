# Database Query SQL Scripts

Kumpulan skrip SQL untuk mengelola database karyawan (*employees*), meliputi Create tabel, *insert* & *update*, agregasi, sort, dan menampilkan data menggunakan subquery.

## Fitur Utama

- **Pembuatan Tabel & Seed Data (`employees.sql`)**: Mendefinisikan skema tabel `employees` yang kompatibel dengan RDBMS (menggunakan `AUTO_INCREMENT PRIMARY KEY`) dan tipe desimal pada kolom `years_of_experience` untuk menghindari kesalahan pemotongan data desimal.
- **Penambahan Record Karyawan (`task_1_add_record.sql`)**: Menambahkan record karyawan baru ke dalam database.
- **Update Records (`task_2_update_engineer_salary.sql`)**: Mengubah gaji semua karyawan dengan posisi 'Engineer' menjadi 85.00 secara massal.
- **Total Salary 2021 (`task_3_total_salary_2021.sql`)**: Menghitung total pengeluaran gaji pada tahun 2021 untuk seluruh karyawan yang aktif bekerja di periode tersebut.
- **Top Experience (`task_4_top_experience.sql`)**: Melakukan sorting untuk menampilkan 3 karyawan teratas yang memiliki Years of Experience paling lama.
- **Subquery Engineer (`task_5_subquery_engineer.sql`)**: Memfilter karyawan berdasarkan posisi 'Engineer' dan masa kerja menggunakan subquery.

---

## Petunjuk Penggunaan

### 1. Inisialisasi Database & Struktur Tabel
Impor atau jalankan isi berkas `employees.sql` di database server Anda (misalnya MySQL, MariaDB, DBeaver, phpMyAdmin, atau MySQL Workbench) untuk membuat tabel `employees` dan mengisi seed data awal:
```sql
-- Jalankan kode di dalam employees.sql
```

### 2. Mengeksekusi Skrip Query 
Anda dapat menjalankan file SQL task satu-per-satu sesuai kebutuhan:
* **task 1 (Tambah Record)**: Eksekusi `task_1_add_record.sql`
* **task 2 (Update Gaji Engineer)**: Eksekusi `task_2_update_engineer_salary.sql`
* **task 3 (Total Pengeluaran Gaji 2021)**: Eksekusi `task_3_total_salary_2021.sql`
* **task 4 (Top 3 Karyawan Berpengalaman)**: Eksekusi `task_4_top_experience.sql`
* **task 5 (Subquery Karyawan Engineer Junior)**: Eksekusi `task_5_subquery_engineer.sql`
