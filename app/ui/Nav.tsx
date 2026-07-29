import Link from "next/link";

export function Nav() {
  const link = { color: "var(--color-text-muted)", textDecoration: "none", fontSize: 14 } as const;
  return (
    <nav style={{ display: "flex", gap: 16, justifyContent: "center", padding: "12px 0 20px" }}>
      <Link href="/" style={link}>Dashboard</Link>
      <Link href="/add" style={link}>Add</Link>
      <Link href="/expenses" style={link}>Expenses</Link>
    </nav>
  );
}
