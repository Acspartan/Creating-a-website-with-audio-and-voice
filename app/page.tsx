import VerifyForm from "./components/VerifyForm";

export default function Home() {
  return (
    <main className="page page-narrow">
      <div className="card">
        <p className="eyebrow">MSU Reflections</p>
        <h1>Verify your access</h1>
        <p className="muted">Enter the access token you were given to begin.</p>
        <VerifyForm />
      </div>
    </main>
  );
}
