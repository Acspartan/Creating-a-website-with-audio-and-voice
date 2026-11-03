"use client";

import { useActionState } from "react";
import { verifyToken } from "../actions";

export default function VerifyForm() {
  const [state, formAction, pending] = useActionState(verifyToken, { error: null });

  return (
    <form action={formAction} className="stack">
      <label htmlFor="token" className="field-label">
        Access token
      </label>
      <input
        id="token"
        name="token"
        className="input"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        aria-describedby={state.error ? "token-error" : undefined}
      />
      {state.error && (
        <p id="token-error" role="alert" className="error">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
