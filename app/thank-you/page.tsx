import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="page page-narrow">
      <div className="card">
        <p className="eyebrow">MSU Reflections</p>
        <h1>Thank you</h1>
        <p className="muted">Your reflection was submitted. You can close this page.</p>
        <Link href="/" className="muted small">
          Back to start
        </Link>
      </div>
    </main>
  );
}
