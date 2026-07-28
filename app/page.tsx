export default function Home() {
  return (
    <div style={{ background: "var(--color-surface)", padding: 24, borderRadius: 16, border: "1px solid var(--color-border)" }}>
      <h1 style={{ color: "var(--color-text)" }}>Theme OK</h1>
      <p style={{ color: "var(--color-text-muted)" }}>Muted text</p>
      <button style={{ background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, padding: "8px 16px", borderRadius: 12 }}>Accent</button>
    </div>
  );
}
