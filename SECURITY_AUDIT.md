# SECURITY AUDIT — asyst-cms (FASE 0)

Tanggal audit: 9 November 2026 · Basis: branch `main` (commit `26a8b58` + perubahan lokal yang belum di-commit)
Cakupan: seluruh `src/`, `prisma/`, `next.config.ts`, `package.json`/`package-lock.json`, `.env.example`, `.gitignore`.
Status: **hanya audit, belum ada kode yang diubah.**

---

## 0. Ringkasan eksekutif

| Tingkat | Jumlah | Contoh utama |
|---|---|---|
| **Kritis** | 2 | Login tanpa rate limit/lockout dan tanpa MFA; XSS tersimpan di halaman preview admin (EDITOR bisa naik jadi ADMIN) |
| **Tinggi** | 8 | Path traversal & penghapusan blob sembarang lewat `deleteMediaAction`; metadata upload dipercaya dari client; SVG diizinkan; sesi JWT 12 jam tanpa invalidasi; link `href` menerima `javascript:`; tidak ada security header; dependency high (zod via `@vercel/blob`) |
| **Sedang** | 13 | Enumerasi user lewat timing bcrypt; password minimal 8; RBAC EDITOR terlalu luas; token preview di URL; tidak ada audit log; `json` field `z.any()`; SSL DB opsional |
| **Rendah** | 10 | `$queryRawUnsafe` (aman saat ini); env divalidasi lazy; pesan error upload bocor; `shadcn` di dependencies produksi |

Yang **sudah baik**: tidak ada registrasi publik; hash bcrypt cost 12; pengecekan sesi di setiap server action/halaman (bukan hanya proxy); user nonaktif ditolak lewat cek DB; API publik hanya mengekspor `GET`/`OPTIONS`, memfilter `status=PUBLISHED` + `publishedAt <= now`, dan serializer berbasis whitelist field; error API publik generik (tanpa stack/pesan Prisma); rich text sudah disanitasi `sanitize-html`; tidak ada variabel `NEXT_PUBLIC_*`; `.env*` di-ignore dan tidak ada secret di riwayat git.

### ⚠️ Perbedaan dengan brief yang perlu dikonfirmasi

1. **Database bukan PostgreSQL/Neon.** Proyek memakai **MySQL 8 / MariaDB** via `@prisma/adapter-mariadb` (`prisma/schema.prisma` → `provider = "mysql"`, [src/lib/prisma.ts](src/lib/prisma.ts)). Checklist "backup PITR di Neon" perlu disesuaikan dengan host MySQL yang dipakai (mis. PlanetScale/Aiven/RDS/TiDB), atau proyek dimigrasi ke Postgres (di luar cakupan hardening).
2. **Whitelist upload brief (jpg/png/webp, 5 MB) lebih sempit dari fitur saat ini** (SVG, GIF, AVIF, MP4, PDF, 20 MB). Membatasinya akan menghapus fitur upload video/PDF → perlu keputusan (lihat §3).
3. **Batas body request Vercel Functions = 4,5 MB**, sedangkan brief meminta batas 5 MB dan validasi magic bytes + `sharp` di server. Upload saat ini langsung dari browser ke Vercel Blob (server tidak pernah melihat isi file). Desain baru diusulkan di FASE 5.

---

## 1. Temuan per poin brief

Format: **[Tingkat] Temuan** — file terkait — rencana perbaikan.

### FASE 1 — Dependency & konfigurasi

**1. Versi dependency** — `package.json`

| Paket | Terpasang | Terbaru stabil (`npm view`) | Tindakan |
|---|---|---|---|
| next | 16.4.5 | 16.4.5 | sudah terbaru |
| react / react-dom | 19.3.0 | **19.3.1** | upgrade patch |
| next-auth | 5.0.0-beta.32 | 5.0.0-beta.32 (tag `beta`; `latest` = 4.x) | tetap di v5 beta terbaru; catat risiko pemakaian beta |
| prisma / @prisma/client | 7.10.1 | 7.10.1 (`prisma@latest` = 8.0.0-rc → **jangan** naik ke RC) | sudah terbaru stabil |
| sanitize-html | 2.18.1 | 2.18.1 | OK |
| @vercel/blob | 2.8.2 | 2.8.2 | lihat audit |

`npm audit`: **4 high, 11 moderate, 2 low, 0 critical.**

- **[Tinggi]** `zod < 4.6.6` (GHSA-mrhx-c7xc-m3w5, DoS memori, CVSS 7.5) masuk lewat `@vercel/blob → @vercel/oidc → @vercel/cli-config → zod@4.1.11`. Saran `npm audit fix` adalah *downgrade* `@vercel/blob` ke 2.4.0 — **tidak** dipakai. Rencana: tambahkan `"overrides": { "zod": "^4.6.7" }` agar seluruh pohon memakai zod yang sudah dipatch (zod langsung kita sudah 4.6.7).
- **[Sedang]** `minimatch`/`typescript-eslint` via `eslint-config-next` (dev-only, tidak ikut runtime) — tunggu update upstream; override `minimatch` bila tersedia patch kompatibel.
- **[Rendah]** `deepmerge`/`ts-morph` via `shadcn` — `shadcn` adalah CLI, tetapi terdaftar di `dependencies`. Pindahkan ke `devDependencies` (begitu juga `dotenv`, `tsx` bila hanya dipakai seed). Mengurangi permukaan serangan runtime.

**2. Dependabot & lockfile** — **[Rendah]** `.github/dependabot.yml` belum ada. `package-lock.json` sudah ter-commit ✓. Rencana: tambah Dependabot npm mingguan (+ `github-actions`), grup patch/minor.

**3. Secret & `server-only`** — **[Sedang]**
- Tidak ada `NEXT_PUBLIC_*` ✓. Hanya [src/server/session.ts](src/server/session.ts) yang memakai `import "server-only"`.
- Modul yang memakai secret tanpa `server-only`: [src/server/preview.ts](src/server/preview.ts) (AUTH_SECRET/PREVIEW_SECRET), [src/lib/env.ts](src/lib/env.ts), [src/lib/prisma.ts](src/lib/prisma.ts), [src/auth.ts](src/auth.ts), `src/server/public/*`.
- Kendala: `src/server/repo/*` dan `src/lib/prisma.ts` sengaja dipakai juga oleh seed (`tsx`), dan `server-only` melempar error di luar kondisi `react-server`. Rencana: tambahkan `server-only` di modul khusus Next; untuk modul bersama, jalankan seed dengan `tsx --conditions=react-server` atau pisahkan entry khusus seed.
- **[Sedang]** Pemakaian ulang `AUTH_SECRET` untuk 3 tujuan berbeda (sesi Auth.js, token preview, salt hash IP form) — [src/server/preview.ts:7](src/server/preview.ts#L7), [src/app/api/forms/[source]/route.ts](src/app/api/forms/[source]/route.ts) (`createHash` IP). Rencana: `PREVIEW_SECRET` dan `IP_HASH_SALT` wajib & terpisah (key separation), sehingga rotasi satu secret tidak memengaruhi yang lain.

**4. Validasi env saat startup** — **[Rendah]** [src/lib/env.ts](src/lib/env.ts) sudah memakai Zod tetapi dipanggil *lazy* (aplikasi tetap start walau env kosong) dan `AUTH_SECRET` hanya minimal 16 karakter. Banyak kode masih membaca `process.env.*` langsung (`prisma.ts`, `preview.ts`, `content.ts`, upload route). Rencana: pindah ke `src/env.ts`, divalidasi saat boot via `instrumentation.ts` (`register()`), wajib di production: `DATABASE_URL` (harus `ssl=true`), `AUTH_SECRET` ≥ 32, `MFA_ENCRYPTION_KEY` (32 byte base64), `PREVIEW_SECRET`, `IP_HASH_SALT`, `ALLOWED_ORIGINS` (tanpa `*`), `UPSTASH_*`, `BLOB_READ_WRITE_TOKEN`. Saat `next build` validasi dilewati lewat `SKIP_ENV_VALIDATION`.

### FASE 2 — Autentikasi & otorisasi

**5. `requireAuth` di setiap entry point** — **[Rendah]** (kondisi saat ini cukup baik)
- `requireUser`/`requirePageUser` sudah dipanggil di semua server action ([src/server/actions/*](src/server/actions/)) dan semua page admin, kecuali [src/app/admin/media/page.tsx](src/app/admin/media/page.tsx) yang hanya mengandalkan layout (aman karena tidak mengambil data, tetapi docs Next memperingatkan layout tidak re-render di navigasi).
- Route `/api/upload` & `/api/upload/local` memakai `getCurrentUser()` ✓. Data layer `src/server/repo/*` tidak memeriksa sesi (dipakai juga oleh seed).
- Proxy [src/proxy.ts](src/proxy.ts) sudah ditandai sebagai lapis pertama ✓.
- Rencana: buat `src/lib/auth-guard.ts` → `requireAuth({ role?, mfa: true })` (berbasis `requireUser` + cek `sessionVersion`, idle timeout, status MFA, `mustChangePassword`), ganti semua `requireUser`/`requirePageUser`, tambahkan di setiap page. Data layer: tambahkan parameter `actor` wajib pada fungsi tulis supaya tidak bisa dipanggil tanpa user (seed memakai actor `system`).

**6. RBAC** — **[Sedang]**
- Saat ini: ADMIN-only hanya `users.*` dan `deleteSubmissionAction`. EDITOR boleh mengubah **semua singleton termasuk `SITE_SETTINGS`** ([src/server/actions/content.ts:61](src/server/actions/content.ts#L61)), unpublish, hapus konten, hapus media, serta membaca semua **form submission (data pribadi pengunjung)**.
- Rencana: matriks izin terpusat (`can(user, action, resource)`). Usulan default: EDITOR = CRUD/publish konten & media; ADMIN = + user, `site-settings` (dan lain yang Anda tentukan), audit log, hapus submission. Butuh keputusan Anda untuk singleton mana yang dianggap "setting" dan apakah EDITOR boleh melihat submission.

**7. Registrasi & password sementara** — **[Sedang]**
- Tidak ada registrasi publik ✓. User dibuat ADMIN di [src/server/actions/users.ts:30](src/server/actions/users.ts#L30) ✓.
- Tidak ada kewajiban ganti password saat login pertama / setelah reset oleh ADMIN.
- Rencana: kolom `mustChangePassword` (diset saat create/reset), `requireAuth` mengalihkan ke `/admin/change-password` sampai diganti.

**8. Kebijakan password** — **[Sedang]** Minimal 8 karakter di [src/server/actions/users.ts:11](src/server/actions/users.ts#L11) & seed. Bcrypt cost 12 ✓. Rencana: minimal 12 karakter, maks 128, tolak password = email; seed ikut aturan yang sama.

**9. MFA TOTP** — **[Kritis]** (bersama poin 12–13) Belum ada MFA sama sekali. Rencana desain (kompatibel dengan Auth.js JWT):
1. Langkah 1: server action verifikasi email+password → set cookie *challenge* httpOnly berumur 5 menit (JWT terenkripsi, berisi `uid` + `sessionVersion`), **tanpa** membuat sesi.
2. Langkah 2: verifikasi kode TOTP/kode cadangan → baru `signIn("credentials", { challenge, code })`; `authorize()` memvalidasi challenge + kode.
3. User tanpa MFA diarahkan ke `/admin/mfa/setup` (QR via `qrcode`, verifikasi kode pertama, tampilkan 10 kode cadangan sekali, simpan hash bcrypt/SHA-256+pepper). Sampai setup selesai, sesi berstatus `mfa:"setup"` dan hanya boleh mengakses halaman setup.
4. Secret TOTP disimpan AES-256-GCM (`MFA_ENCRYPTION_KEY`, IV acak per record, auth tag), library `otplib` dengan window ±1, cegah reuse kode (simpan `lastTotpStep`).
5. ADMIN bisa reset MFA user lain (dicatat audit log, menaikkan `sessionVersion`).

**10. Session** — **[Tinggi]** [src/auth.config.ts](src/auth.config.ts)
- `maxAge` 12 jam, tanpa idle timeout. Cookie Auth.js default sudah httpOnly, `sameSite=lax`, `secure` di HTTPS ✓.
- JWT stateless → **ganti password, reset password oleh ADMIN, perubahan role tidak membatalkan sesi lama**. Role di JWT bisa basi, tetapi `getCurrentUser` membaca role dari DB ✓ (proxy masih memakai role dari JWT untuk `/admin/users`).
- Rencana: `maxAge` 8 jam absolut (`authTime` disimpan di token), idle 30 menit (`lastSeen` di token, diperbarui lewat `updateAge`), kolom `User.sessionVersion` yang dicek di `requireAuth` dan dinaikkan saat ganti/reset password, reset MFA, ubah role, nonaktif. Tambah tombol "keluarkan semua sesi" untuk ADMIN. Cookie name `__Secure-`/`__Host-` di production.

**11. Pesan error login** — **[Sedang]**
- Pesan: "Email atau password salah, atau akun nonaktif." ([src/server/actions/auth.ts:17](src/server/actions/auth.ts#L17)) — sudah generik, akan diseragamkan jadi "Email atau password salah".
- **Enumerasi user lewat timing**: `DUMMY_HASH` dibuat dengan cost **10** ([src/auth.ts:13](src/auth.ts#L13)) sedangkan hash asli cost **12** → email yang tidak terdaftar merespons ±4× lebih cepat. Rencana: dummy hash dengan cost yang sama (dibuat dari konstanta `BCRYPT_COST`).
- **[Rendah]** `callbackUrl` hanya dicek `startsWith("/admin")`; Auth.js membatasi redirect ke origin sendiri, tetapi akan diperketat ke pola path `^/admin(/[\w\-/]*)?(\?.*)?$`.

### FASE 3 — Rate limiting & anti brute force

**12. Rate limit** — **[Kritis]** Tidak ada rate limit pada login (server action `loginAction` maupun `POST /api/auth/callback/credentials` bawaan Auth.js), API publik, maupun server action tulis. Satu-satunya rate limit adalah form publik (5 kiriman/10 menit per IP, berbasis query DB) ✓.
- Rencana: `@upstash/ratelimit` + `@upstash/redis` (sliding window) di `src/lib/rate-limit.ts`; login & MFA: 5/15 menit per IP **dan** per email (hash); `/api/public/*`: 60/menit per IP (respons 429 + `Retry-After`); server action tulis: 30/menit per user (dipasang di `requireAuth({ write: true })`). Endpoint credentials bawaan Auth.js juga diberi limit (atau dinonaktifkan dari jalur langsung karena login lewat challenge MFA). IP diambil dari `ipAddress()` `@vercel/functions` / `x-real-ip` Vercel. Fallback in-memory hanya untuk development.

**13. Lockout akun** — **[Kritis]** Tidak ada. Rencana: kolom `failedLoginCount`, `lockedUntil`; kunci 15 menit setelah 5 gagal berturut-turut (pesan tetap generik), reset saat sukses, catat `LOGIN_FAILED`/`ACCOUNT_LOCKED` di audit log.

### FASE 4 — Validasi input & XSS / injection

**14. Validasi Zod di semua input** — **[Sedang]**
- Konten (`saveItem`/`saveSingleton`) divalidasi Zod dari definisi field ✓, form publik ✓, user ✓, submission ✓.
- Belum divalidasi: `meta` (`status`, `publishedAt`) di `saveCollectionAction`, `status` di `setStatusAction`, `ids` di `reorderAction`/`getMediaManyAction`, `params` di `listMediaAction`, `input.current` di `changeOwnPasswordAction`, `type`/`id`/`slug` (string bebas), `vocabulary` di `refOptions`.
- Field teks tidak punya batas panjang (`z.string()` tanpa `.max`), field `json` (`legacy` produk) memakai `z.any()` ([src/content/fields.ts:353](src/content/fields.ts#L353)) → **[Sedang]** data arbitrer tersimpan dan diteruskan apa adanya ke website.
- Rencana: schema Zod `.strict()` untuk semua argumen action/route; batas default (teks 500, multiline 10.000, rich 200.000, array 200 item); `json` divalidasi skema legacy yang spesifik atau minimal `z.record` + batas ukuran serialisasi.

**15. Sanitasi rich text** — **[Tinggi]** (karena celah di jalur render, bukan di sanitizer)
- [src/server/repo/sanitize.ts](src/server/repo/sanitize.ts) sudah whitelist tag/atribut, `allowedSchemes` http/https/mailto/tel ✓. Kekurangan kecil: `rel` hanya ditambah jika `target=_blank` (brief: semua link eksternal), `allowProtocolRelative` masih default `true` (`//evil.com`), `img src` boleh domain mana pun (tracking pixel), tidak ada batas panjang.
- **[Kritis] XSS tersimpan di preview admin:** [src/components/admin/preview-renderer.tsx:25](src/components/admin/preview-renderer.tsx#L25) me-render **string apa pun** yang mengandung pola HTML lewat `dangerouslySetInnerHTML` — termasuk field teks biasa yang **tidak** disanitasi (judul, deskripsi `lt`, label, dsb.). EDITOR dapat menyisipkan `<p><img src=x onerror=...>` di field non-rich; ketika ADMIN membuka preview, skrip berjalan dengan sesi ADMIN dan bisa memanggil `createUserAction` (eskalasi hak akses). Rencana: render HTML hanya untuk field `rich`, dan tetap disanitasi ulang saat render (defense in depth); field lain dirender sebagai teks.
- Rencana sanitasi: sanitasi juga saat output API publik untuk field rich (data lama/import), `rel="noopener noreferrer"` + `target` hanya `_blank`/hilang untuk semua link absolut, `allowProtocolRelative: false`, `img src` dibatasi ke domain Blob/website sendiri.

**16. `$queryRawUnsafe` / `$executeRawUnsafe`** — **[Rendah]**
- [src/server/actions/media.ts:122-137](src/server/actions/media.ts#L122-L137) (`mediaUsage`): nama tabel dari daftar tetap, nama kolom dari `information_schema`, nilai `id` sudah di-bind (`?`) → tidak ada injection saat ini, tetapi rapuh.
- [prisma/shared.ts:9-17](prisma/shared.ts) (reset seed, CLI saja).
- Rencana: `mediaUsage` diganti query Prisma biasa (FK) + `$queryRaw` tagged template dengan `Prisma.raw` untuk identifier dari allowlist statis; seed memakai `$executeRaw` tagged + allowlist tabel dari `Prisma.ModelName`.

**17. Field URL hanya http/https** — **[Tinggi]**
- `f.url()` sudah membatasi `^https?://` ✓, tetapi **semua field link/CTA/navigasi memakai `f.text()`**: `linkFields.href` ([src/content/shared.ts:16](src/content/shared.ts)), `href`/`link`/`newsLink`/`productsLink`/`collaborationLink` dll. di [src/content/singletons.ts](src/content/singletons.ts) → menerima `javascript:alert(1)` / `data:` → XSS tersimpan di website publik (navigasi & footer muncul di setiap halaman), tergantung cara website me-render `href`.
- `Media.url` di `createMediaAction` hanya `z.string().min(1)` → bisa diisi URL sembarang (lihat poin 18).
- Rencana: tipe field baru `f.href()` = path internal (`^/[^/\\]`), `#anchor`, `mailto:`, `tel:`, atau `https?://`; tolak skema lain; migrasi semua field link ke tipe ini.

### FASE 5 — Upload file

**18. Whitelist & magic bytes** — **[Tinggi]**
- [src/lib/media.ts](src/lib/media.ts) mengizinkan **SVG**, GIF, AVIF, MP4, PDF. Tipe dicek dari `file.type` (MIME dari browser) — di client ([src/components/admin/media/upload.ts](src/components/admin/media/upload.ts)), di token Blob, dan di upload lokal. Tidak ada pemeriksaan magic bytes.
- Upload Blob langsung dari browser → server tidak pernah memeriksa isi file. Setelah itu client memanggil `createMediaAction` dengan `url`, `pathname`, `mimeType`, `size`, `width`, `height` **yang sepenuhnya dikendalikan client** ([src/server/actions/media.ts:15](src/server/actions/media.ts#L15)).
- Upload lokal ([src/app/api/upload/local/route.ts](src/app/api/upload/local/route.ts)) memakai **ekstensi dari nama file asli** → file `x.html` dengan MIME `image/png` tersimpan di `public/uploads/*.html` dan disajikan dari origin CMS (XSS). Hanya aktif di dev, tetapi tetap risiko.
- SVG bisa memuat skrip; di Blob origin-nya terpisah (`*.blob.vercel-storage.com`) sehingga dampaknya terbatas, tetapi di upload lokal satu origin dengan CMS.

**19. Ukuran, SVG, nama UUID, EXIF** — **[Tinggi]** Batas 20 MB; SVG diizinkan; nama file = nama asli + suffix acak (`media/${file.name}` di Blob); EXIF/GPS tidak dihapus; tidak ada kompresi/resize.

**20. Upload hanya user login** — **[Rendah]** Sudah ✓ (`getCurrentUser`), kecuali callback `blob.upload-completed` yang diverifikasi tanda tangan oleh SDK. Pesan error mentah dari SDK dikirim ke client ([src/app/api/upload/route.ts](src/app/api/upload/route.ts), blok `catch`).

**Temuan tambahan terkait media — [Tinggi]** `deleteMediaAction` ([src/server/actions/media.ts:143-159](src/server/actions/media.ts#L143-L159)):
- `unlink(path.join(cwd, "public", m.pathname))` dengan `pathname` dari client → **path traversal** (`uploads/../../.env`) → menghapus file sembarang di server (dev/self-hosted).
- `del(m.url)` untuk URL apa pun yang mengandung `.blob.vercel-storage.com` → user yang login bisa mendaftarkan record Media berisi URL blob lain lalu menghapusnya (termasuk blob milik store lain jika token mengizinkan / file media yang masih dipakai).

**Rencana FASE 5 (desain baru):**
1. Browser tetap upload langsung ke Blob (menghindari batas 4,5 MB Vercel), tetapi ke prefix karantina `tmp/<uuid>` dengan `allowedContentTypes` jpg/png/webp (+ tipe lain bila Anda setujui) dan `maximumSizeInBytes` 5 MB.
2. Server action `finalizeUpload(pathname)` (requireAuth + rate limit): unduh blob karantina dari server, cek magic bytes dengan `file-type`, proses `sharp` (`.rotate()` lalu strip metadata, resize maks mis. 2560 px, re-encode webp/jpeg), simpan ke `media/<uuid>.<ext>` via `put()`, hapus file karantina, buat record Media dengan `url`/`pathname`/`mimeType`/`size`/`width`/`height` **hasil server** — client tidak lagi mengirim metadata.
3. `createMediaAction` publik dihapus/diganti; `deleteMediaAction` hanya menghapus `pathname` yang cocok pola `^media/[0-9a-f-]{36}\.(webp|jpg|png)$` milik store sendiri; upload lokal ikut pipeline yang sama dan menulis hanya ke nama UUID.
4. Opsional: cron pembersih blob `tmp/` yang tidak difinalisasi.

### FASE 6 — API publik

**21. GET, published, DTO** — **[Sedang]**
- Hanya `GET`/`OPTIONS` yang diekspor (method lain otomatis 405) ✓. Filter `PUBLISHED` + `publishedAt <= now` ✓. Serializer membangun output dari daftar field definisi (tidak membocorkan `createdById`, `updatedById`, `searchText`) ✓. Singleton hanya mengirim versi `published` ✓.
- Kekurangan: query memakai `findMany` tanpa `select` (seluruh kolom dimuat ke memori lalu disaring); field `json` legacy diteruskan mentah; `id` internal & `updatedAt` diekspos (rendah).
- **[Sedang] Token preview**: JWT 1 jam yang membuka **seluruh draft** semua resource, dikirim via query string `?preview=` (tercatat di log Vercel, history browser, header `Referer`), tidak bisa dicabut, dan ditandatangani dengan `AUTH_SECRET` bila `PREVIEW_SECRET` kosong. Rencana: secret terpisah wajib, TTL 15–30 menit, klaim `jti` + `sv` (bisa dicabut lewat `sessionVersion`), utamakan header `X-Preview-Token`, `Referrer-Policy: no-referrer` di respons preview, catat penerbitan di audit log.
- Rencana: DTO eksplisit per resource dengan `select` yang dihasilkan dari definisi field (+ test bahwa draft/archived/terjadwal tidak pernah muncul).

**22. CORS** — **[Sedang]** [src/server/public/http.ts](src/server/public/http.ts) sudah membatasi ke `ALLOWED_ORIGINS` dan menambahkan `Vary: Origin` ✓, tetapi masih mengizinkan `*`. Rencana: tolak `*` di production (validasi env), preflight hanya `GET, OPTIONS` (form: `POST, OPTIONS`), method lain dibalas 405 eksplisit dengan header `Allow`. Endpoint `POST /api/forms/*` dipertahankan (fitur website) dengan rate limit Upstash + validasi Zod yang sudah ada.

**23. Error tanpa stack trace** — **[Rendah]** `fail()` sudah mengembalikan pesan generik untuk error non-`PublicError` ✓ dan detail Zod hanya berisi path+pesan ✓. Perbaikan kecil: `/api/upload` membocorkan `e.message`; log server sebaiknya lewat logger yang di-scrub (Sentry).

### FASE 7 — Security headers

**24. CSP, HSTS, dll.** — **[Tinggi]** [next.config.ts](next.config.ts) tidak mengatur header apa pun → panel admin bisa di-*clickjack* (tidak ada `frame-ancestors`/`X-Frame-Options`), tidak ada CSP sebagai mitigasi XSS, tidak ada HSTS.
- Rencana: header statis di `next.config.ts` `headers()` (HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Cross-Origin-Opener-Policy: same-origin`), dan **CSP ber-nonce dibuat di `src/proxy.ts`** sesuai panduan Next 16 (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`): `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'nonce-…'` (perlu dicek dengan Radix/Tiptap/sonner yang memakai inline style → kemungkinan `style-src 'self' 'unsafe-inline'`), `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com`, `connect-src 'self' https://*.blob.vercel-storage.com` (upload langsung), `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. Matcher proxy diperluas agar CSP berlaku di semua halaman HTML (tidak untuk `/api/*` & aset statis). Mulai dengan `Content-Security-Policy-Report-Only` lalu enforce.

**25. `/admin` no-store & noindex** — **[Rendah]** Root layout sudah `robots: { index: false, follow: false }` ✓; halaman admin dinamis sehingga Next mengirim `private, no-cache, no-store` secara default, tetapi tidak dijamin eksplisit. Rencana: header `Cache-Control: no-store` + `X-Robots-Tag: noindex, nofollow` untuk `/admin/:path*`, `/login`, `/api/auth/*`, `/api/upload*`; `robots.txt` `Disallow: /`.

### FASE 8 — Audit log & monitoring

**26–28. Audit log** — **[Sedang]** Belum ada model `AuditLog`; hanya kolom `createdById`/`updatedById` di sebagian model. Tidak ada jejak login, perubahan user, publish, hapus. Rencana: model sesuai brief (+ index `createdAt`, `userId`, `action`; `before`/`after` Json yang di-redact field sensitif seperti `passwordHash`, secret MFA), helper `audit()` dipanggil dari `requireAuth`/repo dalam transaksi yang sama, halaman `/admin/audit-log` (ADMIN, filter user/aksi/tanggal, paginasi), retensi (mis. 1 tahun). Tambah aksi `ACCOUNT_LOCKED`, `LOGOUT`, `PREVIEW_TOKEN` bila disetujui (enum brief + tambahan).

**29. Sentry** — **[Sedang]** Belum ada error tracking; error hanya `console.error`. Rencana: `@sentry/nextjs` (`instrumentation.ts`, `instrumentation-client.ts`), `sendDefaultPii: false`, `beforeSend`/`beforeBreadcrumb` men-scrub `password`, `token`, `cookie`, `authorization`, `preview`, `code`, `secret`; tunnel route agar sesuai CSP. Env: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (build), `SENTRY_ORG`, `SENTRY_PROJECT`.

### FASE 9 — Dokumentasi & verifikasi

**30. SECURITY.md** — belum ada. **31. Test** — belum ada test runner sama sekali (tidak ada Vitest/Jest). **32. Checklist manual** — belum ada. Rencana sesuai brief; checklist DB disesuaikan dengan MySQL (user DB dengan hak minimal `SELECT/INSERT/UPDATE/DELETE` untuk runtime dan user terpisah untuk migrasi, `?ssl=true` dengan verifikasi sertifikat, backup/PITR dari penyedia MySQL).

---

## 2. Temuan tambahan (di luar 32 poin)

| # | Tingkat | Temuan | File | Rencana |
|---|---|---|---|---|
| T1 | Sedang | SSL database opsional; `ssl=accept_invalid_certs` mematikan verifikasi sertifikat; `allowPublicKeyRetrieval` otomatis aktif tanpa SSL (rawan MITM) | [src/lib/prisma.ts](src/lib/prisma.ts) | Di production wajib `ssl=true` dengan `rejectUnauthorized: true`, tolak `accept_invalid_certs` & `allowPublicKeyRetrieval` (validasi env) |
| T2 | Sedang | Proxy membaca role dari JWT untuk `/admin/users`; role basi sampai token kedaluwarsa (page tetap cek DB ✓) | [src/proxy.ts](src/proxy.ts) | Tetap sebagai lapis 1; otoritas di `requireAuth` + `sessionVersion` |
| T3 | Rendah | IP form diambil dari `x-forwarded-for` elemen pertama (bisa dipalsukan bila tidak di belakang Vercel) | [src/app/api/forms/[source]/route.ts](src/app/api/forms/[source]/route.ts) | Pakai `ipAddress()` dari `@vercel/functions` / `x-real-ip` |
| T4 | Rendah | `trustHost: true` tanpa `AUTH_URL` di luar Vercel → host header dipercaya | [src/auth.config.ts](src/auth.config.ts) | Wajibkan `AUTH_URL` bila bukan Vercel |
| T5 | Rendah | `.env.example` berisi password contoh `GantiPasswordIni123!` yang memenuhi aturan saat ini | [.env.example](.env.example) | Kosongkan; seed menolak password contoh |
| T6 | Rendah | Route handler `/api/upload*` tidak memeriksa header `Origin` (server action sudah otomatis) — mitigasi saat ini hanya `SameSite=lax` | [src/app/api/upload/route.ts](src/app/api/upload/route.ts) | Cek `Origin`/`Sec-Fetch-Site` = same-origin |
| T7 | Rendah | `next-auth` masih beta (v5) | `package.json` | Pantau rilis; pin versi exact |

---

## 3. Keputusan yang perlu Anda setujui sebelum FASE 1

1. **Database**: lanjut dengan MySQL (checklist disesuaikan) — *rekomendasi* — atau migrasi ke Postgres/Neon terpisah?
2. **Tipe upload**: (a) persis brief: jpg/png/webp saja, 5 MB, SVG/GIF/AVIF/MP4/PDF ditolak (media lama tetap tersimpan); atau (b) gambar jpg/png/webp via pipeline `sharp` + PDF/MP4 tetap diizinkan dengan validasi magic bytes tanpa re-encode. *Rekomendasi: (a) bila website memang tidak memakai video/PDF dari CMS.*
3. **RBAC**: singleton mana yang khusus ADMIN (usulan: `site-settings`; opsional `navigation`, `footer`, `ui-strings`)? Apakah EDITOR boleh melihat form submission?
4. **Layanan eksternal baru**: Upstash Redis (rate limit) dan Sentry memerlukan akun & env baru — apakah sudah tersedia?
5. **MFA wajib untuk semua akun** berarti semua user (termasuk admin seed) wajib setup MFA saat login berikutnya. Setuju?

## 4. Urutan pengerjaan yang diusulkan

| Fase | Fokus | Prioritas temuan |
|---|---|---|
| 1 | Upgrade react 19.3.1, override zod, pindah CLI ke devDependencies, Dependabot, `src/env.ts`, `server-only` | Tinggi (zod) |
| 2 | `requireAuth`, RBAC, `sessionVersion` + idle timeout, password 12+, `mustChangePassword`, MFA TOTP, perbaiki timing dummy hash | **Kritis** |
| 3 | Upstash rate limit + lockout | **Kritis** |
| 4 | Fix XSS preview, `f.href()`, Zod strict + batas panjang, sanitasi diperketat, hapus `$queryRawUnsafe` | **Kritis** / Tinggi |
| 5 | Pipeline upload karantina → `file-type` + `sharp` → UUID, fix `deleteMediaAction` | Tinggi |
| 6 | DTO/select eksplisit, CORS ketat, token preview diperketat | Sedang |
| 7 | Security headers + CSP nonce di proxy | Tinggi |
| 8 | AuditLog + halaman + Sentry | Sedang |
| 9 | SECURITY.md, Vitest, checklist manual | — |

Catatan: karena temuan Kritis FASE 4 (XSS preview admin) bisa dipakai untuk eskalasi EDITOR → ADMIN, perbaikan satu baris di `preview-renderer.tsx` bisa didahulukan di FASE 1 bila Anda setuju.

Env baru yang akan ditambahkan bertahap ke `.env.example` & Vercel: `MFA_ENCRYPTION_KEY`, `PREVIEW_SECRET` (wajib), `IP_HASH_SALT`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SKIP_ENV_VALIDATION` (build/CI saja).
