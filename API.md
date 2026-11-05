# API asyst-cms

Base URL: `https://<domain-cms>`. Contoh di dokumen ini memakai `http://localhost:3000`.

Ada dua kelompok endpoint:

| Endpoint | Metode | Fungsi |
|---|---|---|
| `/api/public/{resource}` | GET | List collection (berpaginasi) **atau** dokumen singleton |
| `/api/public/{resource}/{slug}` | GET | Detail satu item collection |
| `/api/forms/{source}` | POST | Kirim form dari website (Contact Us, Ask ASYST, lamaran) |

---

## 1. Konvensi umum

### Parameter query

| Parameter | Nilai | Default | Keterangan |
|---|---|---|---|
| `lang` | `id` \| `en` | `id` | Field terlokalisasi dikembalikan sebagai string sesuai bahasa. Kalau versi bahasa itu kosong, dipakai versi bahasa lain. Nilai selain `id`/`en` menghasilkan `400` |
| `page` | ≥ 1 | `1` | Khusus list collection |
| `limit` | 1–100 | per resource | Khusus list collection |
| `q` | teks | – | Pencarian teks (judul/slug/ringkasan), tidak peka huruf besar-kecil |
| `preview` | token | – | Token draft dari tombol *Preview di website*. Bisa juga dikirim lewat header `X-Preview-Token` |

### Format respons

Respons sukses:

```json
{ "data": <objek | array>, "meta": { "lang": "id", ... } }
```

Respons error. `data` selalu `null` dan objek `error` ditambahkan:

```json
{ "data": null, "meta": { "lang": "id" }, "error": { "code": "not_found", "message": "Data tidak ditemukan" } }
```

| HTTP | `error.code` | Penyebab |
|---|---|---|
| 400 | `invalid_lang`, `invalid_param`, `missing_param`, `no_slug`, `singleton_resource`, `invalid_json` | Parameter salah |
| 401 | `invalid_preview_token` | Token preview tidak valid atau kedaluwarsa |
| 403 | `origin_not_allowed` | (forms) Origin tidak ada di `ALLOWED_ORIGINS` |
| 404 | `unknown_resource`, `not_found`, `not_published`, `unknown_form` | Resource atau data tidak ada / belum terbit |
| 422 | `validation_error` | (forms) Isian tidak valid. Rincian per field ada di `error.details[]` |
| 429 | `rate_limited` | (forms) Terlalu banyak kiriman |
| 500 | `internal_error` | Kesalahan server |

### Aturan data

- Hanya data **terbit** yang dikembalikan. Untuk collection, artinya `status = PUBLISHED` dan `publishedAt` kosong atau ≤ sekarang. Untuk singleton, artinya versi yang sudah di-*publish*. Klien dengan `isActive = false` tidak ikut.
- Relasi yang mengarah ke item belum terbit bernilai `null` (single) atau tidak muncul di array (multiple).
- **Media** selalu berbentuk:
  ```json
  { "id": "…", "url": "https://….blob.vercel-storage.com/…", "alt": "…", "caption": null, "width": 1200, "height": 630, "mimeType": "image/webp" }
  ```
- **Relasi** dikembalikan sebagai ringkasan dokumen tujuan, mis. term → `{ id, key, label }`, produk → `{ id, slug, name, tagline, shortDescription, cardImage }`.
- Field FK diberi nama tanpa sufiks `Id`: `categoryId` → `category`, `coverImageId` → `coverImage`.
- **Ikon** berupa kunci string, mis. `"ShieldOutlined"` (CONTENT_SCHEMA §2.4).
- **Link** berbentuk `{ label, type: "internal"|"external"|"action", href, action: "ask-asyst"|"scroll-to"|null, newTab }`.
- Blok page builder (`sections[]`) berbentuk `{ type, …field, anchorId }`. Blok yang ditandai *hidden* tidak dikirim.
- Field teks opsional yang kosong bernilai `null` (teks biasa) atau `""` (teks terlokalisasi).

### Cache & CORS

- `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` (bisa diatur lewat `PUBLIC_CACHE_SMAXAGE` / `PUBLIC_CACHE_SWR`).
- Mode preview mengirim `Cache-Control: private, no-store`. Respons 404 di-cache 30 detik.
- Header `Access-Control-Allow-Origin` hanya dikirim untuk origin yang ada di `ALLOWED_ORIGINS`. Preflight `OPTIONS` mengembalikan `204`.

---

## 2. Resource

### Collection

| Resource | Detail `/{slug}` | `limit` default | Filter tambahan | Urutan |
|---|---|---|---|---|
| `news` | `slug` | 9 | `category`, `tag` (boleh `a,b`), `featured=true` | `publishedAt` desc |
| `jobs` | `slug` | 10 | `department`, `experience`, `type`, `location`, `skill` (key term) | `postedDate` desc |
| `case-studies` | `slug` | 9 | `industry`, `solution`, `technology`, `tag` | `order` |
| `products` | `slug` | 50 | `category` (key ProductCategory), `homeCategory`, `featured=true` | `order` |
| `product-categories` | `key` | 50 | – | `order` |
| `solutions` | `slug` | 50 | – | `order` |
| `industries` | `slug` | 50 | – | `order` |
| `clients` | – | 100 | `placement` = `home-trusted` \| `about` \| `solution` \| `auxoshift` \| `case-study` | `order` |
| `testimonials` | – | 50 | `placement` = `case-study` \| `auxoshift` | `order` |
| `awards`, `leaders`, `offices`, `authors` | – | 50 | – | `order` |
| `terms` | `key` + `?vocabulary=` | 100 | `vocabulary` = `news-category`, `product-category`, `job-department`, `job-experience`, `job-location`, `job-employment-type`, `job-skill`, `case-industry`, `case-solution`, `case-technology`, `tag` | `order` |
| `page-seo` | – | 100 | `path` (persis, mis. `/about-us`) | `order` |

Field turunan yang ditambahkan API:
- `news[].readingTime`: menit baca, dihitung dari isi (200 kata/menit).
- `case-studies[].hasDetail`: `true` kalau studi kasus punya halaman detail. Gunakan untuk sitemap. Detail studi kasus juga menyertakan `related[]` lengkap.
- `terms[].vocabulary`: dalam format kebab-case.

### Singleton

Singleton tidak memakai `/{slug}`. Respons berupa satu objek, dan `meta` berisi `publishedAt` serta `updatedAt`.

| Resource | Isi | Data collection yang ikut disertakan |
|---|---|---|
| `site-settings` | Nama situs, kontak, alamat, sosial, SEO default | `offices[]` |
| `navigation` | Mega menu header | – |
| `footer` | Kolom & link legal | – |
| `ask-asyst-form` | Teks modal Ask ASYST | – |
| `ui-strings` | Microcopy opsional | `strings` (map `key → teks`) |
| `home` | Halaman Home | `awards.items[]`, `trustedBy.items[]` (klien `home-trusted`), `news.items[]` (sejumlah `news.limit`) |
| `about` | Halaman About | `leaders.items[]`, `clients.items[]` (klien `about`) |
| `contact` | Halaman Contact | `offices.items[]` |
| `news-page` | Teks halaman berita | – |
| `career` | Halaman Karier | `opportunity.items[]` (sejumlah `opportunity.limit`) |
| `career-jobs` | Halaman daftar lowongan | – |
| `career-job-detail` | Template teks detail lowongan | – |
| `case-study-page` | Halaman studi kasus | – |
| `product-landing`, `solution-landing`, `industry-landing` | Landing page | – |
| `not-found`, `search` | Halaman 404 & pencarian | – |

---

## 3. Contoh

### List berita (EN, filter kategori)

```http
GET /api/public/news?lang=en&category=product-update&limit=2
Origin: https://www.asyst.co.id
```

```json
{
  "data": [
    {
      "id": "cmw34sr52001ifcqqjzpa5n5n",
      "title": "ASYST Launches Next-Generation Loyalty Platform",
      "slug": "asyst-launches-next-generation-loyalty-platform",
      "excerpt": "A new platform for airline and retail loyalty programmes.",
      "content": "<p>ASYST officially launched its cloud-based loyalty platform.</p><h2>What's next</h2><p>…</p>",
      "coverImage": {
        "id": "cmw34sr2p001hfcqq8corvv9k",
        "url": "https://placehold.co/1200x630/3B58A7/FFFFFF/png?text=Berita%20Loyalty",
        "alt": "Berita Loyalty", "caption": null, "width": 1200, "height": 630, "mimeType": "image/png"
      },
      "category": { "id": "cmw34snxh0003fcqqwvw39gxs", "key": "product-update", "label": "Product Update" },
      "tags": [{ "id": "cmw34spl0000vfcqq0s43vykh", "key": "cloud", "label": "Cloud" }],
      "author": { "id": "cmw34sqr3001efcqqbauqnio4", "name": "Asyst Admin", "avatar": null },
      "isFeatured": true,
      "seo": { "title": "", "description": "", "ogImage": null, "noIndex": false },
      "readingTime": 1,
      "publishedAt": "2026-11-05T05:55:03.744Z",
      "updatedAt": "2026-11-05T05:55:03.751Z"
    }
  ],
  "meta": {
    "lang": "en", "page": 1, "limit": 2, "total": 1, "totalPages": 1,
    "filters": { "category": "product-update" }
  }
}
```

### Detail berita

```http
GET /api/public/news/asyst-launches-next-generation-loyalty-platform?lang=id
```

```json
{ "data": { "id": "…", "title": "ASYST Meluncurkan Platform Loyalty Generasi Baru", "slug": "…", "…": "…" }, "meta": { "lang": "id" } }
```

### Detail studi kasus (dengan halaman detail & relasi)

```http
GET /api/public/case-studies/garuda-indonesia?lang=en
```

```json
{
  "data": {
    "id": "…",
    "title": "Garuda Indonesia ERP Modernisation",
    "slug": "garuda-indonesia",
    "client": { "id": "…", "name": "Garuda Indonesia", "logo": { "url": "…", "alt": "…" }, "logoColor": null, "website": null },
    "cardImage": { "url": "…" },
    "industry": { "id": "…", "key": "airlines", "label": "Airlines" },
    "solution": { "id": "…", "key": "erp", "label": "ERP" },
    "technologies": [{ "id": "…", "key": "sap", "label": "SAP" }],
    "detail": {
      "hero": { "title": "ERP Modernisation\nfor the National Airline", "description": "…", "buttonLabel": "Discuss your project", "image": { "url": "…" } },
      "challenge": { "eyebrow": "Challenge", "title": "Fragmented legacy systems", "paragraphs": ["Data was spread across many applications."], "image": null },
      "outcome": { "items": [{ "title": "40% faster", "description": "Monthly closing." }] },
      "…": "…"
    },
    "related": [{ "slug": "logistics-warehouse-automation", "title": "Logistics Warehouse Automation", "hasDetail": false, "…": "…" }],
    "hasDetail": true,
    "order": 1
  },
  "meta": { "lang": "en" }
}
```

### Produk dengan page builder

```http
GET /api/public/products/amala?lang=en
```

```json
{
  "data": {
    "name": "Amala", "slug": "amala", "tagline": "Loyalty Platform", "template": "BLOCKS",
    "hero": { "breadcrumb": "Product", "title": "Loyalty that\ndrives growth", "image": { "url": "…" }, "…": "…" },
    "sections": [
      { "type": "overview", "title": "One platform for every programme", "paragraphs": ["…"], "points": ["Multi-partner", "Real-time"],
        "cards": [{ "title": "Scalable", "description": "Millions of members.", "tag": "", "icon": "HubOutlined" }], "anchorId": null },
      { "type": "capabilities", "heading": "top", "title": "Key capabilities", "items": [{ "title": "Points management", "icon": "InsightsOutlined", "…": "…" }] }
    ],
    "classic": null, "legacy": null,
    "faq": { "title": "FAQ", "items": [{ "question": "Is Amala cloud-based?", "answer": "Yes, available as SaaS and on-premise." }] },
    "cta": { "title": "Ready to start?", "description": "", "buttonLabel": "Talk to an expert" },
    "seo": { "title": "Amala – Loyalty Platform", "description": "…", "ogImage": null, "noIndex": false }
  },
  "meta": { "lang": "en" }
}
```

### Taksonomi untuk filter

```http
GET /api/public/terms?vocabulary=job-department&lang=en
```

```json
{
  "data": [
    { "id": "…", "vocabulary": "job-department", "key": "engineering", "label": "Engineering", "isPopular": false, "order": 0 },
    { "id": "…", "vocabulary": "job-department", "key": "product", "label": "Product", "isPopular": false, "order": 1 }
  ],
  "meta": { "lang": "en", "page": 1, "limit": 100, "total": 3, "totalPages": 1, "filters": { "vocabulary": "job-department" } }
}
```

### Singleton Home

```http
GET /api/public/home?lang=en
```

```json
{
  "data": {
    "seo": { "title": "Technology for Your Business", "description": "…", "ogImage": null, "noIndex": false },
    "hero": {
      "title": "Technology That\nMoves Business",
      "primaryButton": { "label": "Explore Products", "type": "internal", "href": "/product", "action": null, "newTab": false },
      "secondaryButton": { "label": "Talk to Expert", "type": "action", "href": null, "action": "ask-asyst", "newTab": false },
      "backgroundImage": { "url": "…" }
    },
    "awards": { "show": true, "items": [{ "title": "Top Digital Transformation", "subtitle": "Industry award 2025", "image": { "…": "…" }, "year": 2025 }] },
    "trustedBy": { "title": "Trusted by", "show": true, "items": [{ "name": "Garuda Indonesia", "logo": { "…": "…" } }] },
    "products": {
      "heading": { "eyebrow": "", "title": "Our Products", "description": "" },
      "items": [{ "product": { "slug": "amala", "name": "Amala", "tagline": "Loyalty Platform", "…": "…" }, "category": { "key": "enterprise", "label": "Enterprise" }, "…": "…" }]
    },
    "news": { "title": "Latest News", "limit": 3, "items": [{ "slug": "…", "title": "…", "readingTime": 1 }] },
    "cta": { "title": "Ready to transform?", "description": "…", "buttonLabel": "Talk to an expert" }
  },
  "meta": { "lang": "en", "publishedAt": "2026-11-05T05:55:07.617Z", "updatedAt": "2026-11-05T05:55:07.619Z" }
}
```

### Preview draft

Tombol *Preview di website* membuka `PREVIEW_URL/<path>?preview=<token>`. Website cukup meneruskan token tersebut ke setiap request API:

```http
GET /api/public/news/draft-annual-report?preview=eyJhbGciOiJIUzI1NiJ9…
```

Dengan token yang valid, API mengembalikan draft (status apa pun, dan versi draft untuk singleton), menambahkan `meta.preview = true`, dan mengirim `Cache-Control: private, no-store`. Tanpa token, draft menghasilkan `404`.

### Error

```http
GET /api/public/news?lang=fr
→ 400 { "data": null, "meta": { "lang": "id" }, "error": { "code": "invalid_lang", "message": "Parameter lang harus id atau en" } }

GET /api/public/home/abc
→ 400 { "data": null, "meta": { "lang": "id" }, "error": { "code": "singleton_resource", "message": "\"home\" adalah singleton; gunakan /api/public/home" } }
```

---

## 4. Form website: `POST /api/forms/{source}`

`source`: `contact-us` | `ask-asyst` | `career-apply`

| Field | Wajib | Batas |
|---|---|---|
| `fullName` | Ya | 120 karakter |
| `email` | Ya | email valid |
| `company` | Ya | 160 |
| `message` | Ya | 5000 |
| `topic`, `jobTitle`, `subject` | Tidak | – |
| `phone` | Tidak | angka, spasi, `+()-` |
| `pageUrl` | Tidak | URL halaman asal |
| `language` | Tidak | `id` \| `en` |
| `website` | **Harus kosong** | Honeypot. Sembunyikan field ini dari pengguna |

```http
POST /api/forms/contact-us
Origin: https://www.asyst.co.id
Content-Type: application/json

{ "fullName": "Budi", "email": "budi@contoh.co.id", "company": "PT Contoh", "message": "Halo, saya ingin demo.", "language": "id" }
```

```json
201 { "data": { "id": "cmw34wr4f000034qq1auq9nma", "createdAt": "2026-11-05T05:58:09.999Z" }, "meta": { "source": "contact-us" } }
```

```json
422 {
  "data": null, "meta": { "lang": "id" },
  "error": { "code": "validation_error", "message": "Data tidak valid",
    "details": [{ "path": "fullName", "message": "Nama wajib diisi" }, { "path": "email", "message": "Email tidak valid" }] }
}
```

- Rate limit: 5 kiriman per 10 menit per IP. Kiriman berikutnya mendapat `429`.
- Request dari browser dengan `Origin` yang tidak terdaftar mendapat `403`.
- Kiriman muncul di admin, menu **Form masuk**.
