"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const callbackUrl = String(formData.get("callbackUrl") || "/admin");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl.startsWith("/admin") ? callbackUrl : "/admin",
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Email atau password salah, atau akun nonaktif." };
    throw e; // redirect sukses dilempar sebagai error navigasi
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
