import { SignJWT, jwtVerify } from "jose";

// Token preview: JWT HS256 berumur pendek. Bila valid, API publik mengembalikan draft.

function secret() {
  const s = process.env.PREVIEW_SECRET || process.env.AUTH_SECRET;
  if (!s) throw new Error("PREVIEW_SECRET/AUTH_SECRET belum di-set");
  return new TextEncoder().encode(s);
}

export async function createPreviewToken(userId: string, ttlSeconds = 60 * 60) {
  return new SignJWT({ scope: "preview" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .setIssuer("asyst-cms")
    .sign(secret());
}

export async function verifyPreviewToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "asyst-cms" });
    return payload.scope === "preview";
  } catch {
    return false;
  }
}
