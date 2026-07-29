import type { CSSProperties, ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** visual weight: plain surface, raised elevation, or gradient accent */
  variant?: "surface" | "raised" | "accent";
  /** entrance-stagger index; multiplies a base delay */
  delay?: number;
};

export function Card({
  children,
  style,
  className,
  variant = "surface",
  delay,
}: CardProps) {
  const base: CSSProperties = {
    position: "relative",
    borderRadius: "var(--radius)",
    padding: 20,
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    boxShadow: "var(--shadow-md)",
    // a soft top highlight for a lit, tactile edge
    backgroundImage:
      "linear-gradient(180deg, var(--color-hairline), transparent 42%)",
  };

  const variants: Record<string, CSSProperties> = {
    surface: {},
    raised: { boxShadow: "var(--shadow-lg)" },
    accent: {
      border: "1px solid transparent",
      color: "var(--color-accent-contrast)",
      background:
        "linear-gradient(150deg, var(--color-accent), var(--color-accent-2))",
      backgroundImage:
        "linear-gradient(150deg, var(--color-accent), var(--color-accent-2))",
      boxShadow: "var(--shadow-lg)",
    },
  };

  return (
    <div
      className={`rise${className ? ` ${className}` : ""}`}
      style={{
        ...base,
        ...variants[variant],
        ...(delay != null ? { animationDelay: `${0.06 + delay * 0.07}s` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
