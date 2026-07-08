# Server Backend (Node.js & Express)

Aplikasi server backend sederhana menggunakan Node.js dan framework Express untuk menerima, memvalidasi, menyimpan, dan menampilkan data formulir secara persisten ke dalam file CSV (`data.csv`).

## Fitur Utama

- **Penyimpanan CSV (`data.csv`)**: Data disimpan dalam format CSV.
- **Mendukung Single & Batch Insertion**: API menerima data baik dalam bentuk single object atau array berisi beberapa data sekaligus.
- **Validasi Data**: Memvalidasi setiap field (`name`, `email`, `message`) secara otomatis. Jika dalam pengiriman batch ada salah satu item yang tidak valid, transaksi akan ditolak secara keseluruhan dengan menunjukkan indeks item yang bermasalah.
- **Error Handling Global**:
  - Menangkap dan mengembalikan pesan kesalahan terstruktur jika format payload JSON rusak atau tidak valid (`400 Bad Request`).
  - Mengembalikan status `400 Bad Request` jika request body kosong atau tidak dikirimkan.
  - Penanganan 404 route (`404 Not Found`).

---

## Spesifikasi Endpoint API

### 1. Informasi API (Root)
* **URL**: `/`
* **Metode**: `GET`
* **Deskripsi**: Mengembalikan daftar endpoint dan informasi API.
* **Format Respons**:
```json
{
  "message": "Welcome to the Assessment Backend API",
  "endpoints": {
    "submit": {
      "method": "POST",
      "url": "/api/submit",
      "description": "Submit form data",
      "expectedFields": ["name", "email", "message"]
    },
    "submissions": {
      "method": "GET",
      "url": "/api/submissions",
      "description": "Retrieve all saved submissions"
    }
  }
}
```

---

### 2. Kirim Data Formulir (Submit)
* **URL**: `/api/submit`
* **Metode**: `POST`
* **Header**: `Content-Type: application/json`
* **Payload Objek Tunggal**:
```json
{
  "name": "Alif Wahyulloh",
  "email": "alifw2@gmail.com",
  "message": "Akun Baru"
}
```
* **Payload Massal (Array)**:
```json
[
  {
    "name": "Alif Wahyulloh 1",
    "email": "alifw1@gmail.com",
    "message": "Akun 1"
  },
  {
    "name": "Alif Wahyulloh 2",
    "email": "alifw2@gmail.com",
    "message": "Akun 2"
  }
]
```
* **Format Respons Sukses (Status `201 Created`)**:
```json
{
  "success": true,
  "message": "Submission successfully received and stored!",
  "data": {
    "id": 1,
    "name": "Alif Wahyulloh",
    "email": "alifw2@gmail.com",
    "message": "Akun Baru",
    "createdAt": "2026-07-07T11:15:45.747Z"
  }
}
```

---

### 3. Tampilkan Semua Submissions
* **URL**: `/api/submissions`
* **Metode**: `GET`
* **Deskripsi**: Membaca file `data.csv`, memproses datanya, dan mengembalikannya ke dalam bentuk array JSON terstruktur.
* **Format Respons (Status `200 OK`)**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Alif Wahyulloh 1",
      "email": "alifw1@gmail.com",
      "message": "Akun 1",
      "createdAt": "2026-07-07T11:15:45.756Z"
    },
    {
      "id": 2,
      "name": "Alif Wahyulloh 2",
      "email": "alifw2@gmail.com",
      "message": "Akun 2",
      "createdAt": "2026-07-07T11:15:45.756Z"
    }
  ]
}
```

---

## Petunjuk Penggunaan

### 1. Instalasi Dependensi
Pastikan Node.js sudah terinstal di komputer Anda. Buka terminal di dalam folder project ini dan jalankan command:
```bash
npm install
```

### 2. Menjalankan Server Lokal
Jalankan command berikut untuk mengaktifkan server backend:
```bash
npm start
```
Server akan aktif secara lokal di port `5000` (`http://localhost:5000`). Data submissions akan otomatis tersimpan ke dalam file `data.csv` yang dibuat di folder root project ini.

