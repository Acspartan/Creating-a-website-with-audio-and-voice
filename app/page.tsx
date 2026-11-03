import VerifyForm from "./components/VerifyForm";

export default function Home() {
  return (
    <main>
      <h1>Verify access</h1>
      <p>Enter the token you were given.</p>
      <VerifyForm />
    </main>
  );
}
