import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/server/session";
import { canDo } from "@/server/admin-menu";
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from "@/lib/media";

// Endpoint token untuk client upload Vercel Blob (hanya user login).
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;
  // Callback "upload-completed" datang dari server Vercel (tanpa cookie) — tidak perlu sesi.
  const isCallback = body.type === "blob.upload-completed";
  const user = isCallback ? null : await getCurrentUser();
  if (!isCallback && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user && !(await canDo(user, "sys:media", "create"))) {
    return NextResponse.json({ error: "Anda tidak punya izin upload media." }, { status: 403 });
  }
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_MIME,
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
      // Record Media dibuat oleh client lewat server action setelah upload selesai,
      // agar juga berfungsi di localhost (callback Vercel tidak bisa menjangkau localhost).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
