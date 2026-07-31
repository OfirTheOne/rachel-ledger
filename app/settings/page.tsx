"use client";
import { useEffect, useState } from "react";
import { getJSON, postJSON, patchJSON, delJSON } from "@/lib/api";
import { Card } from "@/app/ui/Card";
import { useT } from "@/app/ui/LanguageProvider";
import { LOCALES, type Locale } from "@/lib/i18n";

type Category = { id: string; name: string };
const FALLBACK = "Other";
const LOCALE_LABELS: Record<Locale, string> = { en: "English", he: "עברית" };

const CHART_VARS = [
  "--color-chart-1", "--color-chart-2", "--color-chart-3",
  "--color-chart-4", "--color-chart-5", "--color-chart-6",
];
function categoryColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % CHART_VARS.length;
  return `var(${CHART_VARS[h]})`;
}

export default function SettingsPage() {
  const { t, locale, setLocale } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setCategories(await getJSON<Category[]>("/api/categories"));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function flash(msg: string) { setError(null); setMessage(msg); setTimeout(() => setMessage(null), 3500); }

  async function add() {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true); setError(null);
    try {
      const created = await postJSON<Category>("/api/categories", { name });
      setCategories((c) => [...c, created]);
      setNewName("");
      flash(t("msg.added", { name: created.name }));
    } catch {
      setError(t("err.add", { name }));
    } finally { setBusy(false); }
  }

  function startEdit(c: Category) {
    setConfirmingId(null); setError(null);
    setEditingId(c.id); setEditName(c.name);
  }

  async function saveEdit() {
    const name = editName.trim();
    if (!editingId || !name || busy) return;
    setBusy(true); setError(null);
    try {
      const updated = await patchJSON<Category>(`/api/categories/${editingId}`, { name });
      setCategories((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      flash(t("msg.renamed"));
    } catch {
      setError(t("err.rename", { name }));
    } finally { setBusy(false); }
  }

  async function confirmDelete(c: Category) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const res = await delJSON<{ movedCount: number }>(`/api/categories/${c.id}`);
      setCategories((cs) => cs.filter((x) => x.id !== c.id));
      setConfirmingId(null);
      flash(
        res.movedCount > 0
          ? t(res.movedCount === 1 ? "msg.deletedMoved.one" : "msg.deletedMoved.other", {
              name: c.name,
              count: res.movedCount,
              fallback: FALLBACK,
            })
          : t("msg.deleted", { name: c.name }),
      );
    } catch {
      setError(t("err.delete"));
    } finally { setBusy(false); }
  }

  async function logout() {
    try { await postJSON("/api/logout", {}); } catch { /* ignore */ }
    window.location.href = "/login";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="rise" style={{ padding: "0 4px" }}>
        <div className="eyebrow">{t("settings.eyebrow")}</div>
        <h1 style={{ fontSize: 27, marginTop: 4 }}>{t("settings.title")}</h1>
      </div>

      {/* Language */}
      <Card delay={0} style={{ display: "grid", gap: 14 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{t("settings.displayEyebrow")}</div>
          <h2 style={{ fontSize: 20 }}>{t("settings.language")}</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
            {t("settings.languageDesc")}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 5,
            borderRadius: 999,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
          }}
        >
          {LOCALES.map((lc) => {
            const active = lc === locale;
            return (
              <button
                key={lc}
                onClick={() => { if (!active) setLocale(lc); }}
                style={{
                  flex: 1,
                  cursor: active ? "default" : "pointer",
                  padding: "9px",
                  borderRadius: 999,
                  border: 0,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--color-accent-contrast)" : "var(--color-text-muted)",
                  background: active
                    ? "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))"
                    : "transparent",
                  transition: "color 0.2s ease, background 0.2s ease",
                }}
              >
                {LOCALE_LABELS[lc]}
              </button>
            );
          })}
        </div>
      </Card>

      <Card delay={1} style={{ display: "grid", gap: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{t("settings.manage")}</div>
          <h2 style={{ fontSize: 20 }}>{t("settings.categories")}</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
            {t("settings.categoriesDesc", { fallback: FALLBACK })}
          </p>
        </div>

        {/* Add */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
            placeholder={t("settings.newCategory")}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 14px",
              borderRadius: 13,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              color: "var(--color-text)",
              outline: "none",
              fontSize: 15,
            }}
          />
          <button
            onClick={add}
            disabled={busy || !newName.trim()}
            style={{
              cursor: newName.trim() ? "pointer" : "default",
              padding: "0 18px",
              borderRadius: 13,
              border: 0,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-accent-contrast)",
              background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
              boxShadow: "var(--shadow-sm)",
              opacity: newName.trim() && !busy ? 1 : 0.5,
              whiteSpace: "nowrap",
            }}
          >
            {t("settings.add")}
          </button>
        </div>

        {(message || error) && (
          <div
            style={{
              fontSize: 13.5,
              padding: "10px 14px",
              borderRadius: 12,
              color: error ? "var(--color-text)" : "var(--color-accent)",
              background: error ? "var(--color-surface-2)" : "var(--color-accent-soft)",
              border: `1px solid ${error ? "var(--color-border)" : "transparent"}`,
            }}
          >
            {error ?? message}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ display: "grid", gap: 8 }}>
            {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {categories.map((c) => {
              const isFallback = c.name === FALLBACK;
              const editing = editingId === c.id;
              const confirming = confirmingId === c.id;
              return (
                <li
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "var(--color-surface-2)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <span
                    aria-hidden
                    style={{ width: 11, height: 11, borderRadius: 4, flexShrink: 0, background: categoryColor(c.name) }}
                  />

                  {editing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                      style={{
                        flex: 1, minWidth: 0, padding: "7px 10px", borderRadius: 9,
                        border: "1px solid var(--color-accent)", background: "var(--color-surface)",
                        color: "var(--color-text)", outline: "none", fontSize: 15,
                      }}
                    />
                  ) : (
                    <span style={{ flex: 1, minWidth: 0, color: "var(--color-text)", fontWeight: 500, fontSize: 15 }}>
                      {c.name}
                      {isFallback && (
                        <span className="eyebrow" style={{ marginInlineStart: 8, fontSize: 9, opacity: 0.8 }}>
                          {t("settings.fallback")}
                        </span>
                      )}
                    </span>
                  )}

                  {/* Actions */}
                  {editing ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <PillBtn onClick={saveEdit} disabled={busy || !editName.trim()} kind="accent">{t("settings.save")}</PillBtn>
                      <PillBtn onClick={() => setEditingId(null)}>{t("settings.cancel")}</PillBtn>
                    </div>
                  ) : confirming ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{t("settings.deleteQ")}</span>
                      <PillBtn onClick={() => confirmDelete(c)} disabled={busy} kind="danger">{t("settings.yes")}</PillBtn>
                      <PillBtn onClick={() => setConfirmingId(null)}>{t("settings.no")}</PillBtn>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <PillBtn onClick={() => startEdit(c)} icon={<PencilIcon />} collapse>{t("settings.rename")}</PillBtn>
                      {!isFallback && (
                        <PillBtn onClick={() => { setEditingId(null); setConfirmingId(c.id); setError(null); }} kind="ghostDanger" icon={<TrashIcon />} collapse>
                          {t("settings.delete")}
                        </PillBtn>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Account */}
      <Card delay={2} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{t("settings.account")}</div>
          <h2 style={{ fontSize: 18 }}>{t("settings.logout")}</h2>
        </div>
        <button
          onClick={logout}
          style={{
            cursor: "pointer",
            padding: "10px 18px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-text)",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            whiteSpace: "nowrap",
          }}
        >
          {t("settings.logout")}
        </button>
      </Card>
    </div>
  );
}

function PillBtn({
  children, onClick, disabled, kind = "plain", icon, collapse,
}: {
  children: string;
  onClick: () => void;
  disabled?: boolean;
  kind?: "plain" | "accent" | "danger" | "ghostDanger";
  icon?: React.ReactNode;
  // When true, the text label is hidden on narrow screens (icon-only).
  collapse?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    plain: { color: "var(--color-text-muted)", background: "transparent", border: "1px solid var(--color-border)" },
    accent: { color: "var(--color-accent-contrast)", background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))", border: "1px solid transparent" },
    danger: { color: "#fff", background: "#c05b4d", border: "1px solid transparent" },
    ghostDanger: { color: "#b0503f", background: "transparent", border: "1px solid var(--color-border)" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={children}
      title={children}
      style={{
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        ...styles[kind],
      }}
    >
      {icon}
      <span className={collapse ? "pill-collapse" : undefined}>{children}</span>
    </button>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
