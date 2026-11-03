"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isActiveToken, supabaseAdmin, TOKEN_COOKIE } from "@/lib/tokens";

export type VerifyState = { error: string | null };

export async function verifyToken(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  const token = String(formData.get("token") ?? "").trim();
  if (!(await isActiveToken(token))) return { error: "That token is not valid." };

  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Submitting a recording deactivates the token, which ends access before this expires.
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/record");
}

const BUCKET = "Recordings";

export type Mode = "audio" | "video";
export type UploadTarget = { path: string; uploadToken: string } | { error: string };

// Browsers record in different containers: Chrome webm, Safari mp4, Firefox audio ogg.
function extensionFor(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

async function activeTokenFromCookie() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  return (await isActiveToken(token)) ? token! : null;
}

// Step 1: hands the browser a one-time URL to upload straight to storage, since recordings
// are far larger than the server action body limit. The path is fixed by the server.
export async function createUploadTarget(mode: Mode, mimeType: string): Promise<UploadTarget> {
  const token = await activeTokenFromCookie();
  if (!token) return { error: "Your access token is no longer valid." };
  if (mode !== "audio" && mode !== "video") return { error: "Unknown recording type." };

  const path = `${mode === "video" ? "Video" : "Audio"}/${token}.${extensionFor(String(mimeType))}`;
  // upsert lets a user retry after a failed attempt; the token is single-use, so only one submission ever completes.
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (error) {
    console.error("Signed upload URL failed:", error);
    return { error: "Could not start the upload. Please try again." };
  }
  return { path: data.path, uploadToken: data.token };
}

// Step 2: only after the file is confirmed in storage is the token spent.
export async function finishSubmission(path: string): Promise<{ error: string }> {
  const token = await activeTokenFromCookie();
  if (!token) return { error: "Your access token is no longer valid." };

  // The path must belong to this token, so nobody can finalize using another file.
  if (!new RegExp(`^(Video|Audio)/${token}\\.(webm|mp4|ogg)$`).test(path)) return { error: "Invalid upload." };

  const supabase = supabaseAdmin();
  const { data: exists, error: existsError } = await supabase.storage.from(BUCKET).exists(path);
  if (existsError || !exists) {
    console.error("Uploaded file not found:", existsError);
    return { error: "Your recording did not finish uploading. Please try again." };
  }

  const { error } = await supabase
    .from("Tokens")
    .update({ UseState: "inactive", TimeUsed: new Date().toISOString() })
    .eq("token", token);
  if (error) {
    console.error("Token deactivation failed:", error);
    return { error: "Your recording was saved, but something went wrong finishing up. Please try again." };
  }

  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/thank-you");
}
