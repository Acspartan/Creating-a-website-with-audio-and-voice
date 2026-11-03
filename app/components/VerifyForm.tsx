"use client";

import { useActionState } from "react";
import { verifyToken } from "../actions";

export default function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyToken, { error: null });

  return (
    <form action={formAction}>
      <label htmlFor="token">Access token</label>{" "}
      <input id="token" name="token" required autoComplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" size={38} />{" "}
      <button type="submit" disabled={pending}>
        {pending ? "Checking..." : "Verify"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
