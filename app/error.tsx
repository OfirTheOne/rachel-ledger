"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 24, textAlign: "center" }}>
      <h2 style={{ color: "var(--color-text)" }}>Something went wrong</h2>
      <p style={{ color: "var(--color-text-muted)" }}>An unexpected error occurred.</p>
      <button onClick={reset} style={{ marginTop: 12, background: "var(--color-accent)", color: "var(--color-accent-contrast)", border: 0, borderRadius: 12, padding: "10px 16px" }}>
        Try again
      </button>
    </div>
  );
}
