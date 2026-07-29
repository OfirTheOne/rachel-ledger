export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      ...style,
    }}>
      {children}
    </div>
  );
}
