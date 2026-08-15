# JSONTree Pro

**JSONTree Pro** adalah visualizer struktur JSON yang bekerja sepenuhnya di browser. Aplikasi ini menyediakan Monaco Editor, validasi dengan jeda 300ms, tree graph interaktif, pencarian key/value, dan generator TypeScript, Dart, Go, serta Zod.

## Menjalankan lokal

Ekstrak proyek lalu jalankan perintah berikut.

```bash
pnpm install
pnpm dev
```

Untuk memeriksa kode sebelum publikasi, gunakan `pnpm test` lalu `pnpm run build:pages`.

## Cara menggunakan

Tempel JSON pada panel editor sebelah kiri. Jika struktur valid, graph pada panel tengah akan diperbarui setelah 300ms. Ketika JSON sementara tidak valid, graph terakhir yang valid tetap ditampilkan sebagai mekanisme fail-safe.

Gunakan scroll untuk zoom dan drag untuk pan graph. Klik node container untuk expand/collapse; klik ganda node untuk menyalin JSON path. Masukkan key atau value pada pencarian untuk menyorot node yang sesuai. Pilih target kode pada panel kanan, kemudian gunakan tombol **Salin kode**.

## Deploy Cloudflare Pages

Hubungkan repository GitHub dengan Cloudflare Pages dan pakai konfigurasi berikut.

| Pengaturan | Nilai |
|---|---|
| Production branch | `main` |
| Build command | `pnpm run build:pages` |
| Build output directory | `dist` |
| Node version | `22` |

File `public/_redirects` sudah tersedia agar halaman `/privacy`, `/terms`, `/disclaimer`, dan `/guide` dapat dibuka langsung.

## Privasi dan batasan

JSON diproses secara lokal pada browser; aplikasi tidak menyediakan backend untuk mengirim data editor. Jangan memasukkan data rahasia yang tidak diperlukan. Generator kode adalah alat bantu awal dan hasilnya perlu diperiksa serta diuji di proyek target sebelum digunakan pada produksi.

Dikembangkan oleh **Virzan Pasa Nugraha**.
