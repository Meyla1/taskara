# TASKARA — Starter Project

Starter website untuk belajar membangun TASKARA dengan Next.js, TypeScript, Tailwind CSS v4, dan Lucide icons.

## 1. Persiapan
- Install Node.js versi LTS dari https://nodejs.org/
- Install Visual Studio Code dari https://code.visualstudio.com/
- Extract folder `taskara-starter`.

## 2. Jalankan website
Buka folder ini di VS Code, lalu buka Terminal > New Terminal. Jalankan:

```bash
npm install
npm run dev
```

Buka http://localhost:3000 di browser.

## 3. Fitur awal
- Dashboard responsif desktop dan mobile
- Sidebar navigasi (sementara hanya mengubah label halaman)
- Tambah tugas sederhana
- Tandai tugas selesai
- Progress tugas otomatis dari daftar tugas

## Catatan
Data tugas masih disimpan sementara di state browser. Jika halaman di-refresh, data akan kembali ke contoh awal. Pada tahap berikutnya kita akan menghubungkan Supabase agar data tersimpan permanen dan akun pengguna dapat dibuat.
