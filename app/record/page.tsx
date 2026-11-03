import Prompts from "../components/Prompts";
import Recorder from "../components/Recorder";

export default function RecordPage() {
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">MSU Reflections</p>
        <h1>Record your reflection</h1>
        <p className="muted">Read both prompts, then record your response.</p>
      </header>
      <div className="record-layout">
        <Prompts />
        <Recorder />
      </div>
    </main>
  );
}
