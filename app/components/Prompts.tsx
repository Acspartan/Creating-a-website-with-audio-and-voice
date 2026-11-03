// Client-supplied prompt text; keep wording verbatim.
const PROMPTS = [
  {
    title: "Please reflect who you are with respect to your role at MSU.",
    body: "Please consider both your formal role and your sense of your own identity. You may choose to address this using formal roles or demographic categories or through a more general sense of who you are and what you do. Please note that some experiences at MSU are particular to some roles such that it may be helpful to understand whether you are a student or staff member, focused on academics or not, have a leadership role or not, or play some combination of roles in our community.",
  },
  {
    title: "Please reflect on your experience with vulnerability as part of the MSU community.",
    body: "Vulnerability is generally understood as the possibility of experiencing something “bad” but consistency on the concept usually ends there. For example, “feeling vulnerable” is usually a negative experience rooted in threat of harm someone else controls. Alternatively, “being vulnerable” is often an important part of authentically connecting through a “leap of faith” in others. As you reflect, please think both about how you respond to your experiences of vulnerability and the roles others play in your experience of vulnerability. Consider whether there are decisions that others make that tend to make things better or worse for you.",
  },
];

export default function Prompts() {
  return (
    <ol className="prompts">
      {PROMPTS.map((p, i) => (
        <li key={i} className="prompt">
          <p className="prompt-label">Prompt {i === 0 ? "One" : "Two"}</p>
          <h2 className="prompt-title">{p.title}</h2>
          <p className="prompt-body">{p.body}</p>
        </li>
      ))}
    </ol>
  );
}
