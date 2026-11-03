"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isActiveToken, TOKEN_COOKIE } from "@/lib/tokens";

export type VerifyState = { error: string | null };

export async function verifyToken(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!(await isActiveToken(token))) return { error: "That token is not valid." };

  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // shortcut: fixed 30-day lifetime, replace once submitting a recording ends the session.
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/record");
}
