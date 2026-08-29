"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getJSON, postJSON, patchJSON, delJSON } from "@/lib/api";
import { Card } from "@/app/ui/Card";
import { useT } from "@/app/ui/LanguageProvider";
import { usePalette } from "@/app/ui/PaletteProvider";
import { LOCALES, type Locale } from "@/lib/i18n";
import { PALETTES, type Palette } from "@/lib/palette";
import { categoryLabel, categoryColorVar } from "@/lib/category";

type Category = { id: string; nameEn: string | null; nameHe: string | null };
const FALLBACK = "Other"; // matched against nameEn
const LOCALE_LABELS: Record<Locale, string> = { en: "English", he: "עברית" };

export default function SettingsPage() {
  const { t, locale, setLocale } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEn, setNewEn] = useState("");
  const [newHe, setNewHe] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState("");
  const [editHe, setEditHe] = useState("");
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
    const en = newEn.trim();
    const he = newHe.trim();
    if ((!en && !he) || busy) return;
    setBusy(true); setError(null);
    try {
      const created = await postJSON<Category>("/api/categories", {
        nameEn: en || null,
        nameHe: he || null,
      });
      setCategories((c) => [...c, created]);
      setNewEn(""); setNewHe("");
      flash(t("msg.added", { name: categoryLabel(created, locale) }));
    } catch {
      setError(t("err.add", { name: en || he }));
    } finally { setBusy(false); }
  }

  function startEdit(c: Category) {
    setConfirmingId(null); setError(null);
    setEditingId(c.id); setEditEn(c.nameEn ?? ""); setEditHe(c.nameHe ?? "");
  }

  async function saveEdit() {
    const en = editEn.trim();
    const he = editHe.trim();
    if (!editingId || (!en && !he) || busy) return;
    setBusy(true); setError(null);
    try {
      const updated = await patchJSON<Category>(`/api/categories/${editingId}`, {
        nameEn: en || null,
        nameHe: he || null,
      });
      setCategories((cs) => cs.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      flash(t("msg.renamed"));
    } catch {
      setError(t("err.rename", { name: en || he }));
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
              name: categoryLabel(c, locale),
              count: res.movedCount,
              fallback: FALLBACK,
            })
          : t("msg.deleted", { name: categoryLabel(c, locale) }),
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

      {/* Colour theme */}
      <ThemeCard />

      <Card delay={2} style={{ display: "grid", gap: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{t("settings.manage")}</div>
          <h2 style={{ fontSize: 20 }}>{t("settings.categories")}</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
            {t("settings.categoriesDesc", { fallback: FALLBACK })}
          </p>
        </div>

        {/* Add — English + Hebrew, either one optional */}
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 8 }}>
            <input
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder={t("settings.nameEn")}
              style={nameInput}
            />
            <input
              value={newHe}
              onChange={(e) => setNewHe(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder={t("settings.nameHe")}
              dir="rtl"
              style={nameInput}
            />
          </div>
          <button
            onClick={add}
            disabled={busy || (!newEn.trim() && !newHe.trim())}
            style={{
              cursor: newEn.trim() || newHe.trim() ? "pointer" : "default",
              padding: "12px 18px",
              borderRadius: 13,
              border: 0,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-accent-contrast)",
              background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
              boxShadow: "var(--shadow-sm)",
              opacity: (newEn.trim() || newHe.trim()) && !busy ? 1 : 0.5,
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
              const isFallback = c.nameEn === FALLBACK;
              const editing = editingId === c.id;
              const confirming = confirmingId === c.id;
              const primary = categoryLabel(c, locale);
              // The name in the *other* language, shown faded when present.
              const secondary = locale === "he" ? c.nameEn : c.nameHe;
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
                    style={{ width: 11, height: 11, borderRadius: 4, flexShrink: 0, background: categoryColorVar(c.id) }}
                  />

                  {editing ? (
                    <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 6 }}>
                      <input
                        autoFocus
                        value={editEn}
                        onChange={(e) => setEditEn(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        placeholder={t("settings.nameEn")}
                        style={editInput}
                      />
                      <input
                        value={editHe}
                        onChange={(e) => setEditHe(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                        placeholder={t("settings.nameHe")}
                        dir="rtl"
                        style={editInput}
                      />
                    </div>
                  ) : (
                    <span style={{ flex: 1, minWidth: 0, color: "var(--color-text)", fontWeight: 500, fontSize: 15 }}>
                      {primary}
                      {secondary && (
                        <span style={{ marginInlineStart: 8, fontSize: 13, fontWeight: 400, color: "var(--color-text-muted)" }}>
                          {secondary}
                        </span>
                      )}
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
                      <PillBtn onClick={saveEdit} disabled={busy || (!editEn.trim() && !editHe.trim())} kind="accent">{t("settings.save")}</PillBtn>
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

      {/* Recurring & installments link */}
      <Link href="/recurring" style={{ textDecoration: "none" }}>
        <Card delay={3} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>{t("recurring.eyebrow")}</div>
            <h2 style={{ fontSize: 18 }}>{t("settings.recurring")}</h2>
          </div>
          <span style={{ color: "var(--color-text-muted)", fontSize: 20 }} aria-hidden>›</span>
        </Card>
      </Link>

      {/* Account */}
      <Card delay={4} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
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

const nameInput: React.CSSProperties = {
  width: "100%", minWidth: 0, padding: "12px 14px", borderRadius: 13,
  border: "1px solid var(--color-border)", background: "var(--color-surface-2)",
  color: "var(--color-text)", outline: "none", fontSize: 15,
};
const editInput: React.CSSProperties = {
  width: "100%", minWidth: 0, padding: "7px 10px", borderRadius: 9,
  border: "1px solid var(--color-accent)", background: "var(--color-surface)",
  color: "var(--color-text)", outline: "none", fontSize: 15,
};

// Representative light-mode colours per palette (mirrors app/theme.css) for the
// swatch previews — accent gradient over the palette's background tint.
const PALETTE_PREVIEW: Record<Palette, { bg: string; a: string; b: string }> = {
  sage: { bg: "#efeae0", a: "#6f8f5c", b: "#c79a54" },
  blue: { bg: "#e9edf1", a: "#5a7f9e", b: "#d98c6a" },
  earth: { bg: "#efe7dc", a: "#b0724f", b: "#7f8a5a" },
  lavender: { bg: "#ece8f0", a: "#8a7fa8", b: "#c79a54" },
  pink: { bg: "#f5e8ee", a: "#cf7093", b: "#b06a9e" },
};

function ThemeCard() {
  const { t } = useT();
  const { palette, setPalette } = usePalette();
  // Local state so the active ring updates instantly (no reload).
  const [selected, setSelected] = useState<Palette>(palette);

  function choose(p: Palette) {
    setSelected(p);
    setPalette(p);
  }

  return (
    <Card delay={1} style={{ display: "grid", gap: 16 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 4 }}>{t("settings.displayEyebrow")}</div>
        <h2 style={{ fontSize: 20 }}>{t("settings.theme")}</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13.5, marginTop: 6, lineHeight: 1.5 }}>
          {t("settings.themeDesc")}
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {PALETTES.map((p) => {
          const c = PALETTE_PREVIEW[p];
          const active = selected === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => choose(p)}
              aria-pressed={active}
              aria-label={t(`palette.${p}`)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 7,
                cursor: "pointer",
                border: 0,
                background: "transparent",
                padding: 0,
              }}
            >
              <span
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: c.bg,
                  display: "grid",
                  placeItems: "center",
                  boxShadow: active ? "0 0 0 2px var(--color-accent)" : "inset 0 0 0 1px var(--color-border)",
                  transition: "box-shadow 0.18s ease",
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    background: `linear-gradient(145deg, ${c.a}, ${c.b})`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                  }}
                />
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: active ? 600 : 500,
                  color: active ? "var(--color-text)" : "var(--color-text-muted)",
                }}
              >
                {t(`palette.${p}`)}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
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
