# Aplikasi Keuangan Ella

Didedikasikan untuk Layla Hayati tercinta.

## Tentang Aplikasi

Aplikasi Keuangan Ella adalah solusi manajemen keuangan komprehensif yang dirancang untuk membantu pengguna melacak, mengelola, dan menganalisis aktivitas keuangan mereka dengan mudah dan efisien. Aplikasi ini dibangun dengan teknologi web modern untuk memberikan pengalaman pengguna yang responsif, intuitif, dan kuat.

## Fitur Utama

-   **Dashboard Interaktif**: Visualisasi data keuangan penting seperti pendapatan, pengeluaran, dan laba rugi dalam satu tampilan terpusat.
-   **Manajemen Transaksi**: Catat transaksi keuangan harian dengan formulir yang mudah digunakan. Lihat, edit, dan hapus transaksi dengan mudah.
-   **Manajemen Data Master**: Kelola daftar akun (Chart of Accounts) dan proyek untuk kategorisasi transaksi yang lebih baik.
-   **Laporan Keuangan Lengkap**:
    -   **Laporan Laba Rugi**: Pantau kinerja keuangan perusahaan selama periode tertentu.
    -   **Neraca Saldo**: Pastikan keseimbangan antara debit dan kredit.
    -   **Neraca**: Dapatkan gambaran tentang aset, kewajiban, dan ekuitas perusahaan pada satu titik waktu.
    -   **Buku Besar**: Rincian semua transaksi yang diposting ke setiap akun.
-   **Otentikasi Pengguna**: Sistem login yang aman untuk melindungi data keuangan Anda.
-   **Alur Verifikasi**: (Jika ada) Proses persetujuan untuk transaksi atau entri penting lainnya.

## Teknologi yang Digunakan

-   **Frontend**:
    -   [React](https://reactjs.org/)
    -   [Vite](https://vitejs.dev/)
    -   [TypeScript](https://www.typescriptlang.org/)
    -   [Tailwind CSS](https://tailwindcss.com/)
-   **Manajemen State**:
    -   [Zustand](https://github.com/pmndrs/zustand)
-   **Routing**:
    -   [React Router](https://reactrouter.com/)
-   **Formulir**:
    -   [React Hook Form](https://react-hook-form.com/)
    -   [Zod](https://zod.dev/)
-   **Backend & Database**:
    -   [Supabase](https://supabase.io/)
-   **Visualisasi Data**:
    -   [Recharts](https://recharts.org/)

## Memulai

Untuk menjalankan proyek ini secara lokal, ikuti langkah-langkah berikut:

1.  **Clone repositori:**
    ```bash
    git clone https://github.com/mrhdayat/aplikasi-keuangan-ella.git
    cd aplikasi-keuangan-ella
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi environment variables:**
    Buat file `.env` di root proyek dan tambahkan kredensial Supabase Anda:
    ```
    VITE_SUPABASE_URL=URL_SUPABASE_ANDA
    VITE_SUPABASE_ANON_KEY=KUNCI_ANON_SUPABASE_ANDA
    ```

4.  **Jalankan aplikasi:**
    ```bash
    npm run dev
    ```

Aplikasi akan berjalan di `http://localhost:5173`.

## Dibuat oleh

Muhammad Rahmat Hidayat