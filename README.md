# asyst-cms

CMS custom untuk website company profile **PT Aero Systems Indonesia (ASYST)**. Website `asyst-web` (Vite/React) mengambil konten bilingual (ID/EN) dari API publik CMS ini.

Acuan model data ada di [`CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md). Dokumentasi endpoint ada di [`API.md`](API.md).

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript, React 19 |
| Database | **MySQL 8 / MariaDB 10.4+** + Prisma 7 (driver adapter `@prisma/adapter-mariadb`) |
| Auth | Auth.js v5: credentials email + password (bcrypt), sesi JWT, role `ADMIN` / `EDITOR` |
| Upload | Vercel Blob (client upload), dengan fallback `public/uploads` saat development |
| UI admin | **Atlas Design System** (token & komponen dari [androsap/atlas-design-system](https://github.com/androsap/atlas-design-system)) di atas Tailwind CSS 4 + Radix, font Inter/Manrope, bahasa Indonesia |
| Form | react-hook-form + Zod (skema yang sama dipakai di client dan server) |

---

## Fitur

- **Login** di `/login`. Semua route `/admin/**` diproteksi oleh `src/proxy.ts` (di Next 16 namanya *proxy*, dulu *middleware*). Setiap page dan server action juga memeriksa sesi dan status aktif user ke DB.
- **Dashboard** dengan sidebar yang dikelompokkan per jenis konten.
- **15 collection**: berita, penulis, lowongan, studi kasus, produk, kategori produk, solusi, industri, klien, testimoni, penghargaan, pimpinan, kantor, taksonomi, dan SEO halaman. Setiap collection punya list (search, filter status, pagination, urut berdasarkan `order`), create, edit, delete, dan halaman **Atur urutan** dengan drag & drop.
- **18 singleton** (halaman dan pengaturan global) dengan form edit masing-masing.
- **Bilingual**: tab **Indonesia / English** di atas form. Field non-teks (gambar, link, relasi) dipakai bersama oleh kedua bahasa. Kalau salah satu bahasa kosong, situs memakai bahasa lainnya.
- **Draft / published**:
  - Collection memakai `status` (`DRAFT`/`PUBLISHED`/`ARCHIVED`) dan `publishedAt`. Tanggal di masa depan berarti terjadwal.
  - Singleton menyimpan **draft** dan **versi terbit** secara terpisah. Tombol *Simpan draft* tidak mengubah situs, tombol *Publish* menerbitkan, dan *Buang perubahan draft* mengembalikan ke versi terbit.
- **Preview**: tersedia *Preview di CMS* (data terlokalisasi seperti respons API) dan *Preview di website*, yaitu `PREVIEW_URL` + token draft yang berlaku 1 jam.
- **Media**: upload dengan preview, drag & drop, alt text dan caption ID/EN, serta cek pemakaian sebelum media dihapus.
- **Page builder** untuk Produk, Solusi, dan Industri: 23 tipe blok (CONTENT_SCHEMA §3.M), plus template khusus `CLASSIC`, `SOC`, dan `AVIATION`.
- **Form masuk**: endpoint `POST /api/forms/{contact-us|ask-asyst|career-apply}` dengan CORS, honeypot, dan rate limit. Kirimannya dikelola di inbox admin.
- **Manajemen user** (khusus ADMIN): tambah, edit role, nonaktifkan, reset password. Semua user bisa mengganti password sendiri.
- **API publik read-only** di `/api/public/[resource]` dan `/api/public/[resource]/[slug]`: hanya data terbit, `?lang=id|en`, CORS dari `ALLOWED_ORIGINS`, header cache `s-maxage` + `stale-while-revalidate`, dan format respons `{ data, meta }`.

---

## Setup lokal

Prasyarat: **Node.js ≥ 22** dan **MySQL 8.0+** (disarankan, sama dengan production) atau MariaDB 10.4+. Prisma Studio butuh MySQL 8 / MariaDB 10.5+.

```bash
npm install                 # juga menjalankan `prisma generate`
cp .env.example .env        # lalu isi nilainya (lihat tabel di bawah)
```

### Siapkan database MySQL

Buat database (wajib **utf8mb4** + **utf8mb4_unicode_ci**) dan user khusus:

```sql
CREATE DATABASE asyst_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER asyst@% IDENTIFIED BY ganti-password-kuat;
GRANT ALL PRIVILEGES ON asyst_cms.* TO asyst@%;
-- Hanya untuk development: `prisma migrate dev` membuat shadow database sementara
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO asyst@%;
FLUSH PRIVILEGES;
```

Lalu isi `.env`: `DATABASE_URL="mysql://asyst:PASSWORD@127.0.0.1:3306/asyst_cms"` (dan `DIRECT_URL` sama).

Pilihan server lokal:
- **XAMPP / Laragon** (MariaDB 10.4+): jalankan MySQL dari control panel, buat database lewat phpMyAdmin atau SQL di atas.
- **Docker (disarankan, dipakai saat pengembangan)**: lihat bagian *MySQL lokal via Docker* di bawah.
- **MySQL Community Server** untuk Windows/macOS.

> Catatan MySQL: field array enum (`placements` di Klien/Testimoni) disimpan sebagai kolom **JSON** dan difilter dengan `JSON_CONTAINS`; pencarian mengandalkan collation `utf8mb4_unicode_ci` yang case-insensitive.

### Migrasi, seed, jalankan

```bash
npm run db:migrate          # prisma migrate dev — buat/terapkan migrasi
npm run db:seed             # akun admin dari env + contoh data semua jenis konten
npm run dev                 # http://localhost:3000 → /login
```

- Seed **tidak menimpa** konten yang sudah ada. Pakai `SEED_RESET=true npm run db:seed` untuk menghapus semua konten lalu mengisi ulang (tabel user tidak disentuh).
- `SEED_ADMIN_RESET_PASSWORD=true npm run db:seed` mereset password admin yang sudah ada.
- Semua contoh data melewati validasi Zod yang sama dengan form admin, jadi seed sekaligus menjadi tes registry konten.
- Gambar contoh memakai placeholder dari `placehold.co`.

Skrip lain: `npm run db:import-web` (impor konten asli website, lihat [Impor konten asli website](#impor-konten-asli-website)), `npm run db:seed-news` (berita dummy untuk pengembangan: 9 terbit + 1 draf, sampul foto dari `../asyst-web` yang di-crop 16:9 dan diberi color grading seragam; butuh hasil `db:import-web`; hapus lagi dengan `NEWS_DUMMY_REMOVE=true`), `npm run db:studio` (Prisma Studio), `npm run typecheck`, `npm run lint`, `npm run build`.

### Environment

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | Ya | `mysql://user:pass@host:3306/db`. Tambahkan `?ssl=true` untuk server cloud yang mewajibkan TLS |
| `DATABASE_POOL_MAX` | Tidak | Ukuran pool koneksi per instance aplikasi, default `5`. Turunkan bila `max_connections` server kecil |
| `DIRECT_URL` | Tidak | Koneksi untuk Prisma CLI (migrate/studio/seed). Kalau kosong, memakai `DATABASE_URL` |
| `AUTH_SECRET` | Ya | Minimal 32 karakter acak (`npx auth secret` atau `openssl rand -base64 32`) |
| `AUTH_URL` | Tidak | Hanya untuk hosting non-Vercel |
| `ALLOWED_ORIGINS` | Ya | Origin website yang boleh memanggil API dari browser, dipisah koma. `*` = semua (hindari di production) |
| `PUBLIC_CACHE_SMAXAGE` / `PUBLIC_CACHE_SWR` | Tidak | Detik, default `60` / `600` |
| `PREVIEW_URL` | Tidak | URL asyst-web untuk tombol *Preview di website* |
| `PREVIEW_SECRET` | Tidak | Secret token preview. Default memakai `AUTH_SECRET` |
| `BLOB_READ_WRITE_TOKEN` | Production | Otomatis terisi di Vercel setelah Blob store dihubungkan. Kalau kosong saat dev, upload disimpan ke `public/uploads` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | Seed | Akun admin awal (password minimal 8 karakter) |

### MySQL lokal via Docker

Sekali saja (butuh Docker Desktop berjalan):

```bash
docker run -d --name asyst-mysql --restart unless-stopped -p 3306:3306   -v asyst-mysql-data:/var/lib/mysql   -e MYSQL_ROOT_PASSWORD=rootlokal -e MYSQL_DATABASE=asyst_cms   mysql:8.4 --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

# buat user aplikasi (tunggu ±20 detik sampai MySQL siap)
docker exec asyst-mysql mysql -uroot -prootlokal -e "CREATE USER asyst@% IDENTIFIED BY asystlokal; GRANT ALL ON asyst_cms.* TO asyst@%; GRANT CREATE, ALTER, DROP, REFERENCES, INDEX ON *.* TO asyst@%; FLUSH PRIVILEGES;"
```

`.env`: `DATABASE_URL="mysql://asyst:asystlokal@127.0.0.1:3306/asyst_cms"` (DIRECT_URL sama), lalu `npm run db:migrate` dan `npm run db:seed`.

Sehari-hari:

| Perintah | Fungsi |
|---|---|
| `docker start asyst-mysql` / `docker stop asyst-mysql` | Nyalakan / matikan MySQL (otomatis menyala bersama Docker Desktop karena `--restart unless-stopped`) |
| `docker exec -it asyst-mysql mysql -uasyst -pasystlokal asyst_cms` | Konsol SQL |
| `docker logs asyst-mysql` | Log server |
| `docker rm -f asyst-mysql && docker volume rm asyst-mysql-data` | Hapus total (data ikut hilang) |

Data tersimpan di volume `asyst-mysql-data`, jadi aman walau container dihapus/dibuat ulang (selama volume tidak dihapus).

### Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Login selalu "Email atau password salah" padahal benar | Biasanya **database tidak bisa diakses** (Auth.js menyamarkan semua error login). Pastikan Docker Desktop & container `asyst-mysql` berjalan (`docker ps`), lalu **restart `npm run dev`**. Cek akun dengan Prisma Studio (tabel `User`). Reset password: `SEED_ADMIN_RESET_PASSWORD=true npm run db:seed` |
| `RSA public key is not available client side` / `pool failed to retrieve a connection` | MySQL 8 (`caching_sha2_password`) tanpa TLS. Sudah ditangani otomatis (`allowPublicKeyRetrieval` aktif bila tanpa SSL); pastikan memakai versi `src/lib/prisma.ts` terbaru & restart dev server. Di production gunakan `?ssl=true` |
| `localhost:5555` *refused to connect* | Prisma Studio belum dijalankan. Jalankan `npm run db:studio` dan biarkan terminalnya terbuka |
| Studio: *Could not load schema metadata* | Server MariaDB 10.4 (mis. XAMPP). Gunakan MySQL 8 (Docker di atas) |

### Mengakses database

- **Prisma Studio**: `npm run db:studio`, lalu buka `http://localhost:5555`. Mengikuti `DATABASE_URL`/`DIRECT_URL` di `.env`, jadi bisa juga diarahkan ke production.
  > Prisma Studio butuh **MySQL 8 / MariaDB 10.5+** (memakai `JSON_ARRAYAGG`). Di MariaDB 10.4 (XAMPP) Studio menampilkan *"Could not load schema metadata"*. Aplikasi CMS sendiri tetap berjalan di 10.4; gunakan HeidiSQL/DBeaver/phpMyAdmin atau upgrade server.
- **GUI**: HeidiSQL, DBeaver, TablePlus, MySQL Workbench, atau phpMyAdmin (XAMPP). Isi host, port, user, password, dan database sesuai `DATABASE_URL`.
- **CLI**: `mysql -h 127.0.0.1 -P 3306 -u asyst -p asyst_cms`
- **Production**: pakai konsol web penyedia (TiDB/Aiven/RDS) atau GUI dengan SSL aktif. Untuk tim yang hanya perlu melihat data, buat user **read-only**: `GRANT SELECT ON asyst_cms.* TO 'viewer'@'%'`.

---

## Deploy ke Vercel

1. **Push repo** ke GitHub/GitLab, lalu *Add New → Project* di Vercel dan import repo ini. Framework terdeteksi sebagai Next.js.
2. **Database MySQL**: Vercel tidak menyediakan MySQL bawaan. Gunakan MySQL terkelola yang bisa diakses dari internet, misalnya **TiDB Cloud Serverless**, **Aiven for MySQL**, **PlanetScale**, **DigitalOcean / AWS RDS / Google Cloud SQL**, atau server MySQL milik ASYST yang dibuka untuk IP Vercel. Isi `DATABASE_URL` (dan `DIRECT_URL`) dengan `mysql://…?ssl=true`.
   > Pilih region yang dekat dengan region fungsi Vercel (mis. Singapura `sin1`). Pastikan `max_connections` server ≥ (jumlah instance × `DATABASE_POOL_MAX`).
3. **Blob**: di tab *Storage*, buat **Blob store** dan hubungkan ke project. `BLOB_READ_WRITE_TOKEN` akan terisi otomatis.
4. **Environment variables**: isi `AUTH_SECRET`, `ALLOWED_ORIGINS` (mis. `https://www.asyst.co.id`), dan `PREVIEW_URL`. `PUBLIC_CACHE_*` opsional.
5. **Build command**: `package.json` punya skrip `vercel-build` (`prisma generate && prisma migrate deploy && next build`), dan Vercel otomatis memakai skrip ini. Migrasi diterapkan di setiap deploy.
   > Kalau deploy *preview* tidak boleh memigrasi database production, beri environment Preview database terpisah, atau ubah Build Command Preview menjadi `npm run build`.
6. **Seed pertama** (sekali saja), dari mesin lokal yang mengarah ke DB production:
   ```bash
   DATABASE_URL="mysql://…production…?ssl=true" SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed
   ```
   Kalau tidak ingin contoh data di production, jalankan seed di DB kosong lalu hapus konten contoh dari admin, atau buat admin lewat Prisma Studio.
7. Login di `https://<domain-cms>/login` dan **ganti password admin** lewat menu profil.

Caching: respons API publik membawa `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`, sehingga Vercel CDN menyajikan cache dan memperbarui di belakang layar. Perubahan konten akan tampil di website paling lambat sekitar `s-maxage` detik.

---

## Integrasi dengan asyst-web

```ts
const CMS = import.meta.env.VITE_CMS_URL; // mis. https://cms.asyst.co.id
const lang = localStorage.getItem("language") === "EN" ? "en" : "id";
const preview = new URLSearchParams(location.search).get("preview"); // dari tombol "Preview di website"

const res = await fetch(`${CMS}/api/public/home?lang=${lang}${preview ? `&preview=${preview}` : ""}`);
const { data, meta } = await res.json();
```

- Ikon dikirim sebagai **kunci string** (CONTENT_SCHEMA §2.4). Frontend memetakan kunci tersebut ke komponen React.
- Untuk sitemap dan `initialize/index.cjs`, ambil slug dari `/api/public/news`, `/jobs`, `/case-studies` (pakai yang `hasDetail: true`), `/products`, `/solutions`, dan `/industries` dengan `?limit=100&page=N`.
- Form Contact Us dan Ask ASYST cukup `POST` ke `/api/forms/contact-us` atau `/api/forms/ask-asyst` (lihat API.md).
- Dev website berjalan di `http://localhost:3006`; origin ini harus ada di `ALLOWED_ORIGINS` (tanpanya form mendapat `403 origin_not_allowed`).

### Impor konten asli website

Konten asli website diekspor oleh `npm run export:cms` di `../asyst-web` ke `../asyst-web/cms-export/asyst-content.json`, lalu diimpor ke CMS:

```bash
IMPORT_DRY_RUN=true npm run db:import-web   # validasi saja, tidak menulis apa pun
IMPORT_RESET=true   npm run db:import-web   # impor pertama: hapus data contoh seed, lalu impor
npm run db:import-web                       # impor ulang / update (idempoten, tidak menduplikasi)
```

PowerShell: `$env:IMPORT_RESET="true"; npm run db:import-web` (hapus lagi dengan `Remove-Item Env:IMPORT_RESET`).

- Semua item melewati validasi Zod dan sanitasi yang sama dengan form admin. Item yang gagal dilaporkan di ringkasan akhir dan exit code menjadi ≠ 0.
- Record dicocokkan dengan natural key: `vocabulary+key` untuk term, `slug` untuk produk, solusi, industri, lowongan, dan studi kasus, `name` untuk klien, testimoni, penulis, dan pimpinan, `key` untuk kategori produk, dan judul EN untuk kantor dan penghargaan. Yang sudah ada di-update; urutan tampil disamakan dengan file.
- Media disalin ke `public/uploads/asyst-web/…`. Bila `BLOB_READ_WRITE_TOKEN` diisi, media diunggah ke Vercel Blob `asyst-web/…`. Record `Media` di-upsert berdasarkan `pathname`.
- Env opsional: `ASYST_WEB_DIR` (default `../asyst-web`) dan `IMPORT_FILE`.
- **Perhatian:** impor menimpa perubahan yang dibuat editor di admin untuk item yang ada di file ekspor.

---

## Arsitektur & struktur folder

Inti CMS adalah **registry konten** di `src/content/`. Setiap jenis konten didefinisikan sekali memakai DSL field (`f.l()`, `f.media()`, `f.array()`, `f.blocks()`, `f.ref()`, …). Dari definisi itu otomatis terbentuk:

1. **Skema Zod** untuk validasi (client dan server),
2. **Form admin** (tab ID/EN, array, page builder, media picker, relasi),
3. **Serializer API publik** (lokalisasi `{id,en}` → string, resolve `mediaId` dan relasi, sembunyikan blok `hidden`),
4. Kolom list, kolom pencarian (`searchText`), dan filter API.

```
prisma/
  schema.prisma            model data (field L<…> = Json {id,en}; struktur bersarang = Json)
  migrations/              migrasi SQL
  seed.ts, seed-data/      akun admin + contoh data
src/
  proxy.ts                 proteksi /admin & /login (Auth.js)
  auth.ts, auth.config.ts  Auth.js credentials + role di JWT
  content/                 ⬅ registry: fields.ts (DSL), shared.ts, blocks.ts, collections.ts, singletons.ts, icons.ts
  server/
    repo/                  CRUD generik, mapping form ↔ Prisma, slug unik, sanitasi HTML
    public/                serializer, query+filter, extras singleton, CORS/cache/response
    actions/               server actions admin (semua memanggil requireUser)
    session.ts, preview.ts
  app/
    login/, admin/         UI admin (c/[type] = collection, s/[key] = singleton, preview/, media/, submissions/, users/)
    api/public/…           API publik read-only
    api/forms/[source]     POST form website
    api/upload/…           token Vercel Blob & fallback upload lokal
  components/admin/        shell, sidebar, form engine, media library, sortable list, preview renderer
```

### Menambah / mengubah field

1. Edit definisi di `src/content/collections.ts` atau `singletons.ts`.
2. Untuk **singleton** atau field di dalam Json (hero, sections, …), **tidak perlu migrasi**. Data lama otomatis dilengkapi nilai default (`withDefaults`).
3. Untuk **kolom top-level collection**, tambahkan juga kolomnya di `schema.prisma` dengan nama key yang sama, lalu jalankan `npm run db:migrate`.
4. Blok baru untuk page builder cukup ditambahkan ke `BLOCKS` di `src/content/blocks.ts`.

### Keamanan

- Password di-hash dengan bcrypt (cost 12). Login gagal memberi pesan yang sama untuk email salah maupun password salah.
- Setiap server action memeriksa ulang sesi dan status aktif user. Manajemen user dan hapus form masuk hanya untuk ADMIN. Sistem menjaga agar selalu ada minimal satu ADMIN aktif.
- HTML rich text disanitasi di server (`sanitize-html`, whitelist tag).
- Token preview berupa JWT HS256 berumur 1 jam. Respons preview diberi `Cache-Control: private, no-store`.
- Endpoint form memakai CORS, honeypot, rate limit 5 kiriman per 10 menit per IP (IP disimpan dalam bentuk hash), dan validasi Zod.
