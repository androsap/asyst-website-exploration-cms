# Handoff: integrasi asyst-web ↔ asyst-web-cms

> **Untuk Claude yang bekerja di project `asyst-web-cms`.** Baca seluruh file ini, lalu kerjakan tugas §1–§5 berurutan.
> Repo website ada di folder saudara `../asyst-web` (Vite + React). Jangan ubah kode di `../asyst-web`; cukup baca file yang disebut di sini.
> Acuan yang sudah ada di repo ini: `API.md`, `CONTENT_SCHEMA.md`, `src/content/*`, `prisma/seed.ts`.

## 0. Konteks: yang sudah selesai di sisi website

Website `asyst-web` sudah tersambung ke API publik CMS ini.

| Bagian | Detail |
|---|---|
| Base URL | Website membaca `VITE_CMS_URL` (dev: `http://localhost:3000`). Saat `vite` dev server (port **3006**), request lewat proxy `/cms-api` → `http://localhost:3000/api`. |
| Konten | Setiap halaman membaca singleton/collection via `GET /api/public/...?lang=id\|en`. Bila resource gagal/404 atau field kosong, website memakai konten bawaan di `../asyst-web/src/consts` (fallback). Pemetaan ada di `../asyst-web/src/lib/cms/bindings/*.ts`. |
| Taksonomi | Website memakai `key` term sebagai nilai filter dan URL (mis. `?department=software-engineering`). Label diambil dari `terms?vocabulary=…`. |
| Form | Contact Us → `POST /api/forms/contact-us`; modal Ask ASYST → `POST /api/forms/ask-asyst`. Honeypot `website` sudah dikirim (kosong). |
| Preview | Website membaca `?preview=<token>`, menyimpannya per tab, dan meneruskannya ke setiap request. Saat aktif, tampil badge "Mode preview". |
| Media | URL media relatif (mis. `/uploads/x.webp` dari upload lokal) otomatis diberi prefiks origin CMS oleh website. |
| Sitemap | `../asyst-web/initialize/index.cjs` mengambil slug `case-studies` (yang `hasDetail`), `jobs`, dan `news` dari CMS saat build. |
| Ekspor konten | `../asyst-web/cms-export/asyst-content.json` berisi **seluruh konten asli website** dalam format nilai field CMS (dibuat dengan `npm run export:cms` di `../asyst-web`). File inilah yang harus diimpor (§3). |

Saat ini database CMS hanya berisi **data contoh dari seed** (gambar `placehold.co`, teks dummy), sehingga website menampilkan data contoh itu. Tujuan handoff ini adalah mengganti data contoh dengan konten asli.

---

## 1. Konfigurasi env (wajib)

Ubah `.env` (dan sesuaikan `.env.example` agar terdokumentasi):

```env
ALLOWED_ORIGINS="http://localhost:3006,http://localhost:5173,https://www.asyst.co.id"
PREVIEW_URL="http://localhost:3006"
```

- Tanpa `http://localhost:3006`, form website mendapat `403 origin_not_allowed`. Ini sudah terverifikasi.
- `PREVIEW_URL` dipakai tombol *Preview di website*.
- Restart `npm run dev` setelah mengubah env.

---

## 2. Penyesuaian skema konten (wajib sebelum impor)

Ada tiga selisih antara skema CMS dan bentuk data website. Semua blok disimpan di kolom JSON, jadi perubahan ini **tidak butuh migrasi Prisma**. Cukup ubah definisi field.

### 2.1 `src/content/blocks.ts` → blok `capabilities`: `highlight` harus teks, bukan boolean

Di website, `highlight` adalah kalimat pendek dengan ikon centang, mis. *"Every channel works from the same member record."*

```ts
// sebelum
highlight: f.bool("Highlight"),
// sesudah
highlight: f.l("Highlight", { help: "Kalimat singkat dengan ikon centang di bawah deskripsi. Opsional." }),
```

Periksa juga `preview-renderer.tsx` dan komponen admin lain yang mungkin menganggap `highlight` boolean.

### 2.2 `src/content/blocks.ts` → blok `steps`: grup per langkah berbentuk `{ label, text, points }`

Website (`SolutionDetailGroup`) memakai label grup, teks opsional, dan daftar poin. Contoh data: label *"Key Activities:"* lalu poin-poin. Sekarang `steps.items[].groups` memakai `groupItem` (`{ title, items }`) yang sama dengan blok `architecture`.

- **Ubah hanya blok `steps`.** Blok `architecture` tetap memakai `groupItem` karena di website bentuknya memang `{ title, items }`.

```ts
const stepGroupItem: Fields = {
  label: f.l("Label grup", { required: true }),
  text: f.lt("Teks"),
  points: f.llist("Poin"),
};
// di blok steps:
groups: f.array("Grup", stepGroupItem, { itemLabel: "label" }),
```

Website tetap menerima bentuk lama `{ title, items }` sebagai cadangan, tetapi ekspor memakai bentuk baru. Tanpa perubahan ini validasi Zod saat impor akan gagal.

### 2.3 `src/content/icons.ts`: tambahkan semua kunci ikon yang dipakai website

Field ikon tidak divalidasi terhadap daftar, tetapi picker di admin hanya menampilkan `ICON_GROUPS`. Tambahkan kunci yang dipakai konten asli (daftar lengkap ada di `../asyst-web/cms-export/asyst-content.json` → `icons`), mis. `AccountBalanceOutlined`, `NotificationsActiveOutlined`, `SwapHorizOutlined`, `VisibilityOffOutlined`, `FlightOutlined`, `GavelOutlined`, `BusinessOutlined`, `CloudOutlined`, `EngineeringOutlined`, `TimelineOutlined`, dan lainnya.

- Cara paling aman: baca array `icons` dari JSON tersebut, lalu masukkan semua kunci yang belum ada ke grup "Material".
- Kunci menu header, highlight Home, dan kapabilitas yang sudah ada tetap dipertahankan.
- Website memetakan kunci `XxxOutlined` → komponen `XxxOutlinedIcon` di `../asyst-web/src/components/ui/icons.tsx`. Daftar kunci yang valid bisa dibaca dari file itu (setiap `export const <Nama>Icon`).
- Bila admin punya pratinjau ikon, pastikan kunci baru tidak membuatnya error. Bila pratinjau butuh komponen, tampilkan nama kunci saja sebagai fallback.

### 2.4 Opsional, tidak wajib untuk impor

- `industries.aviation.layers`: website menampilkan `description` sebagai paragraf (dipecah per baris kosong). Gambar layer masih diambil dari kode. Bila editor perlu mengganti gambarnya, tambahkan `image: f.media("Gambar")`; website sudah membaca field `image` lewat merge.
- `search.labels`: website juga punya label `resultCountSingle`, `emptyQuery`, dan `quickNoResult`. Bila ingin bisa diedit, tambahkan sebagai `f.l(...)`. Website saat ini memakai teks bawaan untuk ketiganya.

Jalankan `npm run typecheck` dan `npm run lint` setelah perubahan.

---

## 3. Importer konten asli (tugas utama)

Buat `prisma/import-asyst-web.ts` dan script npm `"db:import-web": "tsx prisma/import-asyst-web.ts"`. Tiru pola `prisma/seed.ts`:

- `withDefaults(def.fields, data)` → `saveItem(def, id, values, { status }, userId)` untuk collection.
- `saveSingleton(def, withDefaults(def.fields, data), userId, true)` untuk singleton (langsung publish).

Dengan begitu semua data melewati validasi Zod dan sanitasi yang sama dengan form admin.

### 3.1 Input

| Env | Default | Arti |
|---|---|---|
| `ASYST_WEB_DIR` | `../asyst-web` | Root project website (sumber file media). |
| `IMPORT_FILE` | `${ASYST_WEB_DIR}/cms-export/asyst-content.json` | File hasil ekspor. Bila belum ada, minta pengguna menjalankan `npm run export:cms` di `../asyst-web`. |
| `IMPORT_RESET` | `false` | `true` = hapus semua konten (seperti `SEED_RESET`, kecuali `User`, `_prisma_migrations`, `FormSubmission`) sebelum impor. **Disarankan `true` untuk impor pertama** supaya data contoh seed hilang. Faktorkan `resetContent()` dari `seed.ts` ke modul bersama, jangan diduplikasi. |
| `IMPORT_DRY_RUN` | `false` | `true` = validasi semua data (withDefaults + `validateValues`) tanpa menulis ke DB, lalu laporkan error. |

User untuk `uploadedById`/`updatedById`: pakai admin dari `SEED_ADMIN_EMAIL`. Bila tidak ada, pakai user ADMIN pertama.

### 3.2 Format file ekspor

```jsonc
{
  "version": 1,
  "icons": ["ShieldOutlined", ...],          // kunci ikon yang dipakai (§2.3)
  "media": ["src/assets/asyst/img/....webp", "public/logo-asyst.png", ...],
  "collections": {                            // kunci = CollectionDef.type
    "terms": [{ "order": 0, "data": { "vocabulary": "JOB_DEPARTMENT", "key": "software-engineering", "label": { "id": "…", "en": "…" }, "isPopular": false } }],
    "jobs":  [{ "status": "PUBLISHED", "order": 0, "data": { "title": {…}, "departmentId": { "$ref": "terms", "vocabulary": "JOB_DEPARTMENT", "key": "software-engineering" }, … } }],
    …
  },
  "singletons": { "home": { … }, "navigation": { … }, … }   // kunci = SingletonDef.slug
}
```

Nilai di dalam `data` dan `singletons` sudah memakai **nama field CMS** (termasuk FK bersufiks `Id`, mis. `coverImageId`, `logoId`). Teks memakai `{ id, en }`, daftar memakai `{ id: [], en: [] }`, ikon berupa string kunci. Field opsional yang kosong dihilangkan; lengkapi dengan `withDefaults`.

Ada dua penanda yang harus di-resolve **rekursif di seluruh pohon**, termasuk di dalam array, blok `sections`, objek `classic`/`soc`/`aviation`, dan singleton:

| Penanda | Ganti dengan |
|---|---|
| `{ "$media": "<path>", "alt"?: { id, en } }` | `id` record `Media` (string) |
| `{ "$ref": "<collection>", … }` | `id` record tujuan (string) |

Kunci pencarian `$ref`:

| `$ref` | Dicocokkan dengan |
|---|---|
| `terms` | `vocabulary` + `key` |
| `products`, `case-studies`, `solutions`, `industries` | `slug` |
| `clients`, `testimonials`, `authors` | `name` |
| `product-categories` | `key` |

Penanda `$ref` yang tidak ditemukan → `null` (single) atau dibuang dari array, lalu catat sebagai peringatan.

### 3.3 Media

Untuk setiap path unik:

1. Baca file dari `path.join(ASYST_WEB_DIR, p)`.
2. Tentukan `mimeType` dari ekstensi (`.webp`, `.png`, `.jpg/.jpeg`, `.svg`, `.gif`, `.mp4`). Pastikan termasuk `ALLOWED_MIME`.
3. Unggah:
   - Bila `blobEnabled()`: pakai `put()` dari `@vercel/blob` dengan pathname `asyst-web/<p>` (`access: "public"`, `addRandomSuffix: false`, `allowOverwrite: true`).
   - Bila tidak: salin ke `public/uploads/asyst-web/<p>` dengan URL `/uploads/asyst-web/<p>`. Pola upload lokal ada di `src/app/api/upload/local/route.ts`.
4. Buat/upsert record `Media` berdasarkan `pathname` unik (`asyst-web/<p>`) supaya impor ulang tidak menduplikasi. Isi `filename`, `size`, `mimeType`, `url`, `uploadedById`. `width`/`height` boleh `null`; isi bila mudah dibaca dari header PNG/WebP, tanpa dependensi baru.
5. `alt`: pakai `alt` dari penanda pertama yang punya alt. Bila tidak ada, buat dari nama file (`trusted-garuda-indonesia.webp` → "Trusted Garuda Indonesia") untuk kedua bahasa.

### 3.4 Urutan impor (karena relasi)

1. `terms`
2. `authors`
3. `clients`
4. `testimonials`
5. `awards`
6. `leaders`
7. `offices`
8. `products`
9. `product-categories` (field `products` = relasi join berurutan ke produk)
10. `solutions` (`clients` → klien)
11. `industries`
12. `jobs`
13. `case-studies`, dua tahap:
    - Tahap 1: simpan semua tanpa field `related` (set `[]`).
    - Tahap 2: update `related` setelah semua slug ada.
14. `news` (kosong di ekspor, lihat §5)
15. `page-seo` (kosong)
16. Semua **singleton**. Singleton merujuk produk, term, studi kasus, testimoni, kategori produk, solusi, industri, dan klien.

Aturan per item:
- Bila sudah ada (cocok berdasarkan natural key di atas), **update** via `saveItem(def, existingId, …)`. Bila belum, **create**. Impor harus idempoten: menjalankan dua kali tidak menduplikasi data.
- `status`: pakai `item.status` (`"PUBLISHED"`) untuk collection `hasStatus`.
- Urutan: create mengikuti urutan array. Bila item sudah ada, panggil `reorderItems` per collection (per `vocabulary` untuk terms) sesuai urutan file supaya urutan tampil sama dengan website.

### 3.5 Laporan & error handling

- Jangan berhenti di error pertama. Kumpulkan `ValidationError` (`e.fieldErrors`) per item dengan identitas jelas (`jobs[slug=…]`, `singleton home`), lanjutkan item lain, lalu cetak ringkasan di akhir: jumlah create/update/gagal per collection, singleton yang tersimpan, media yang diunggah, ref yang tidak ter-resolve.
- Exit code ≠ 0 bila ada item gagal.
- Hormati `IMPORT_DRY_RUN`.

### 3.6 Catatan data (keputusan saat ekspor, bukan bug)

- **Klien** digabung jadi 12 record unik dengan `placements` (`HOME_TRUSTED`, `ABOUT`, `SOLUTION`, `CASE_STUDY`). Logo memakai versi "about-us/clients"; Garuda punya `logoColorId` untuk studi kasus. Urutan klien kini satu untuk semua penempatan.
- **Testimoni**: konten lama mengulang 2 testimoni untuk mengisi carousel; diekspor sebagai 3 record unik.
- **Produk Amala** muncul di dua kategori katalog dengan tagline berbeda; di CMS memakai satu tagline ("Loyalty & Customer Engagement Platform").
- **Auxoshift** diekspor sebagai `LEGACY_API` dengan hero/SEO minimal. Halamannya di website masih memakai API lama.
- **Label penulis berita** memakai placeholder `{author}` (mis. "Posted by {author}"). Website menggantinya dengan nama penulis artikel.
- **Berita tidak diekspor** (lihat §5).

---

## 4. Verifikasi (wajib, laporkan hasilnya)

1. `IMPORT_DRY_RUN=true npm run db:import-web` → 0 error validasi.
2. `IMPORT_RESET=true npm run db:import-web` → ringkasan sukses. Jalankan sekali lagi **tanpa** reset dan pastikan tidak ada duplikasi (jumlah record sama, semuanya "update").
3. Cek API:
   ```bash
   curl "http://localhost:3000/api/public/home?lang=en"                         # hero: "Technology That Moves Complex Businesses Forward"
   curl "http://localhost:3000/api/public/products/apollo?lang=id"              # template BLOCKS, sections terisi
   curl "http://localhost:3000/api/public/solutions/managed-it-services?lang=en"  # blok steps dengan groups { label, text, points }
   curl "http://localhost:3000/api/public/terms?vocabulary=job-skill&lang=id"   # ada isPopular=true
   curl "http://localhost:3000/api/public/case-studies/garuda-indonesia?lang=en" # hasDetail true, related terisi
   curl -X POST "http://localhost:3000/api/forms/contact-us" -H "Origin: http://localhost:3006" -H "Content-Type: application/json" -d '{"fullName":"","email":"x","company":"","message":""}'   # 422 validation_error, BUKAN 403
   ```
4. Buka website `http://localhost:3006` (jalankan `npm start` di `../asyst-web` bila belum jalan). Halaman berikut harus menampilkan konten asli (bukan placeholder) dalam ID & EN, tanpa error di console:
   - `/`, `/about`, `/contact-us`, `/career`, `/career/jobs`, `/case-study`, `/case-study/garuda-indonesia`
   - `/product`, `/product/amala`, `/product/chronus`, `/solution`, `/solution/security-operations-center`, `/industry`, `/industry/aviation`, `/industry/cargo`
5. Admin: buka beberapa item (produk blocks, solusi SOC, industri Aviation, singleton Home) dan pastikan form terbuka tanpa error dan ikon tampil di picker. Simpan ulang satu item tanpa perubahan untuk memastikan validasi lolos.

---

## 5. Lanjutan (opsional, tanyakan pengguna dulu)

- **Berita lama**: berita asli ada di API lama `https://www.asyst.co.id/api/v1/news/retrieve` (model `NewsModel` di `../asyst-web/src/models/news.model.ts`: `title`, `slug`, `category`, `caption`, `content` HTML, `image`, `created_date`, satu bahasa). API ini mungkin butuh token (`ASYST_API_TOKEN`). Importer berita bisa mengisi `title`/`excerpt`/`content` ke kedua bahasa, mengunduh `image` sebagai media, membuat term `NEWS_CATEGORY` bila belum ada, dan memakai `created_date` sebagai `publishedAt`. **Mengunduh data dari server produksi perlu persetujuan pengguna.**
- **Produksi**: set `ALLOWED_ORIGINS` ke domain website produksi, `PREVIEW_URL` ke URL website produksi, dan `BLOB_READ_WRITE_TOKEN` supaya media diunggah ke Vercel Blob (URL absolut). Di website, isi `VITE_CMS_URL` di `../asyst-web/.env.prd`.
- **Revalidasi**: website adalah SPA tanpa cache build, jadi perubahan CMS tampil setelah cache API (`s-maxage=60`) kedaluwarsa. Sitemap baru diperbarui saat website di-build ulang. Pertimbangkan webhook "publish → trigger build website" bila deploy memakai Vercel.

## Definition of done

- [ ] `.env` & `.env.example` diperbarui (§1).
- [ ] Skema: `capabilities.highlight` → teks, `steps.groups` → `{ label, text, points }`, kunci ikon ditambahkan (§2). Typecheck & lint lolos.
- [ ] `prisma/import-asyst-web.ts` + `npm run db:import-web` dengan reset, dry-run, idempoten, dan laporan (§3).
- [ ] Impor penuh tanpa error; impor ulang tanpa duplikasi.
- [ ] Verifikasi §4 dilaporkan, termasuk halaman website yang dicek dan hasilnya.
