import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/session";
import { canDo } from "@/server/admin-menu";
import { blobEnabled } from "@/lib/env";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/media";
import { slugify } from "@/lib/slug";

// Fallback upload untuk development lokal TANPA BLOB_READ_WRITE_TOKEN.
// File disimpan ke public/uploads. Di Vercel (filesystem read-only) endpoint ini dinonaktifkan.
export async function POST(req: NextRequest) {
  if (blobEnabled() || process.env.VERCEL) {
    return NextResponse.json({ error: "Upload lokal nonaktif; gunakan Vercel Blob." }, { status: 400 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canDo(user, "sys:media", "create")))
    return NextResponse.json({ error: "Anda tidak punya izin upload media." }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "File tidak ada" }, { status: 400 });
  if (!ALLOWED_MIME.includes(file.type)) return NextResponse.json({ error: "Tipe file tidak diizinkan" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Ukuran file terlalu besar" }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = slugify(path.basename(file.name, path.extname(file.name))) || "file";
  const pathname = `uploads/${base}-${randomBytes(4).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", pathname), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/${pathname}`, pathname, contentType: file.type });
}
