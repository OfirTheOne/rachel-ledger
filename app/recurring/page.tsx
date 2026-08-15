"use client";
import { useEffect, useState, useCallback } from "react";
import { getJSON, postJSON, patchJSON, delJSON } from "@/lib/api";
import { agorotFromInput, formatMoney } from "@/lib/format";
import { Card } from "@/app/ui/Card";
import { useT } from "@/app/ui/LanguageProvider";

type Category = { id: string; name: string };
type Template = {
  id: string; name: string; amountAgorot: number | null; dayOfMonth: number | null;
  active: boolean; paymentMethod: string; category: { name: string };
};
type Occurrence = {
  id: string; periodMonth: string;
  recurringPayment: Template;
};
type Plan = {
  id: string; shop: string; totalAmountAgorot: number; count: number;
  category: { name: string }; paidCount: number; paidAgorot: number;
};
const METHOD_VALUES = ["Cash", "Credit", "Debit", "BankTransfer", "Other"];

export default function RecurringPage() {
  const { t, locale } = useT();
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [occ, tpl, pl] = await Promise.all([
      getJSON<Occurrence[]>("/api/recurring/occurrences"),
      getJSON<Template[]>("/api/recurring"),
      getJSON<Plan[]>("/api/installments"),
    ]);
    setOccurrences(occ);
    setTemplates(tpl);
    setPlans(pl);
    // prefill confirm amounts: fixed -> its amount, variable -> empty
    setAmounts((prev) => {
      const next = { ...prev };
      for (const o of occ) {
        if (next[o.id] === undefined) {
          const a = o.recurringPayment.amountAgorot;
          next[o.id] = a != null ? (a / 100).toFixed(2) : "";
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    (async () => {
      await postJSON("/api/recurring/run", {}).catch(() => {});
      await load();
      getJSON<Category[]>("/api/categories").then(setCategories);
    })();
  }, [load]);

  function monthLabel(iso: string) {
    return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(
      locale === "he" ? "he-IL" : "en-US",
      { month: "long", year: "numeric" },
    );
  }

  async function confirmOcc(o: Occurrence) {
    const amountAgorot = agorotFromInput(amounts[o.id] ?? "");
    if (!Number.isInteger(amountAgorot) || amountAgorot <= 0 || busy) return;
    setBusy(true);
    try {
      const day = Math.min(o.recurringPayment.dayOfMonth ?? 1, 28);
      const date = `${o.periodMonth.slice(0, 7)}-${String(day).padStart(2, "0")}`;
      await postJSON(`/api/recurring/occurrences/${o.id}/confirm`, { amountAgorot, date });
      await load();
    } finally { setBusy(false); }
  }
  async function skipOcc(o: Occurrence) {
    if (busy) return;
    setBusy(true);
    try { await postJSON(`/api/recurring/occurrences/${o.id}/skip`, {}); await load(); }
    finally { setBusy(false); }
  }
  async function toggleActive(tpl: Template) {
    setBusy(true);
    try { await patchJSON(`/api/recurring/${tpl.id}`, { active: !tpl.active }); await load(); }
    finally { setBusy(false); }
  }
  async function deleteTemplate(id: string) {
    setBusy(true);
    try { await delJSON(`/api/recurring/${id}`); setConfirmingDelete(null); await load(); }
    finally { setBusy(false); }
  }
  async function deletePlan(id: string) {
    setBusy(true);
    try { await delJSON(`/api/installments/${id}`); setConfirmingDelete(null); await load(); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="rise" style={{ padding: "0 4px" }}>
        <div className="eyebrow">{t("recurring.eyebrow")}</div>
        <h1 style={{ fontSize: 26, marginTop: 4 }}>{t("recurring.title")}</h1>
      </div>

      {/* Due now */}
      <Card delay={0} style={{ display: "grid", gap: 14 }}>
        <h2 style={{ fontSize: 19 }}>{t("recurring.dueNow")}</h2>
        {occurrences.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>{t("recurring.noneDue")}</p>
        ) : (
          occurrences.map((o) => {
            const variable = o.recurringPayment.amountAgorot == null;
            return (
              <div key={o.id} style={{ display: "grid", gap: 8, padding: "12px", borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{o.recurringPayment.name}</span>
                  <span className="eyebrow" style={{ fontSize: 10 }}>{monthLabel(o.periodMonth)}</span>
                </div>
                <div style={{ color: "var(--color-text-muted)", fontSize: 12.5 }}>
                  {o.recurringPayment.category.name}
                  {variable && ` · ${t("recurring.variableTag")}`}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                    <span style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}>₪</span>
                    <input
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amounts[o.id] ?? ""}
                      onChange={(e) => setAmounts((m) => ({ ...m, [o.id]: e.target.value }))}
                      className="mono"
                      style={{ ...fieldStyle, paddingInlineStart: 28 }}
                    />
                  </div>
                  <button onClick={() => confirmOcc(o)} disabled={busy} style={confirmBtn}>{t("recurring.confirm")}</button>
                  <button onClick={() => skipOcc(o)} disabled={busy} style={ghostBtn}>{t("recurring.skip")}</button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Templates + new */}
      <Card delay={1} style={{ display: "grid", gap: 14 }}>
        <h2 style={{ fontSize: 19 }}>{t("recurring.templates")}</h2>
        {templates.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>{t("recurring.none")}</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {templates.map((tpl) => (
              <div key={tpl.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", opacity: tpl.active ? 1 : 0.6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    {tpl.name}
                    {!tpl.active && <span className="eyebrow" style={{ marginInlineStart: 8, fontSize: 9 }}>{t("recurring.paused")}</span>}
                  </div>
                  <div className="mono" style={{ color: "var(--color-text-muted)", fontSize: 12.5 }}>
                    {tpl.amountAgorot != null ? formatMoney(tpl.amountAgorot) : t("recurring.variableTag")}
                    {" · "}{tpl.category.name}
                  </div>
                </div>
                {confirmingDelete === `t:${tpl.id}` ? (
                  <>
                    <button onClick={() => deleteTemplate(tpl.id)} disabled={busy} style={dangerBtn}>{t("settings.yes")}</button>
                    <button onClick={() => setConfirmingDelete(null)} style={ghostBtn}>{t("settings.no")}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleActive(tpl)} disabled={busy} style={ghostBtn}>
                      {tpl.active ? t("recurring.pause") : t("recurring.resume")}
                    </button>
                    <button onClick={() => setConfirmingDelete(`t:${tpl.id}`)} style={{ ...ghostBtn, color: "#b0503f" }}>{t("recurring.delete")}</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <NewTemplateForm categories={categories} onCreated={load} />
      </Card>

      {/* Installment plans */}
      <Card delay={2} style={{ display: "grid", gap: 14 }}>
        <h2 style={{ fontSize: 19 }}>{t("recurring.plans")}</h2>
        {plans.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>{t("recurring.noPlans")}</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {plans.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{p.shop}</div>
                  <div className="mono" style={{ color: "var(--color-text-muted)", fontSize: 12.5 }}>
                    {t("recurring.progress", { paid: p.paidCount, count: p.count })}
                    {" · "}{formatMoney(p.paidAgorot)} / {formatMoney(p.totalAmountAgorot)}
                  </div>
                </div>
                {confirmingDelete === `p:${p.id}` ? (
                  <>
                    <button onClick={() => deletePlan(p.id)} disabled={busy} style={dangerBtn}>{t("settings.yes")}</button>
                    <button onClick={() => setConfirmingDelete(null)} style={ghostBtn}>{t("settings.no")}</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmingDelete(`p:${p.id}`)} style={{ ...ghostBtn, color: "#b0503f" }}>{t("recurring.delete")}</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewTemplateForm({ categories, onCreated }: { categories: Category[]; onCreated: () => void }) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BankTransfer");
  const [variable, setVariable] = useState(false);
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startMonth, setStartMonth] = useState(new Date().toISOString().slice(0, 7));
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (categories[0] && !categoryId) setCategoryId(categories[0].id); }, [categories, categoryId]);

  const amountAgorot = agorotFromInput(amount);
  const canCreate = name.trim() !== "" && categoryId !== "" && (variable || (Number.isInteger(amountAgorot) && amountAgorot > 0));

  async function create() {
    if (!canCreate || saving) return;
    setSaving(true);
    try {
      await postJSON("/api/recurring", {
        name: name.trim(),
        categoryId,
        paymentMethod,
        amountAgorot: variable ? null : amountAgorot,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth, 10) : null,
        startMonth: `${startMonth}-01`,
      });
      setName(""); setAmount(""); onCreated();
    } finally { setSaving(false); }
  }

  return (
    <div style={{ display: "grid", gap: 12, paddingTop: 6, borderTop: "1px solid var(--color-hairline)" }}>
      <div className="eyebrow">{t("recurring.new")}</div>
      <input style={fieldStyle} placeholder={t("recurring.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {categories.map((c) => {
          const active = c.id === categoryId;
          return (
            <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} style={{ ...chip, ...(active ? chipActive : {}) }}>{c.name}</button>
          );
        })}
      </div>

      {/* Fixed / variable toggle */}
      <div style={segWrap}>
        {[["fixed", false], ["variable", true]].map(([label, v]) => {
          const active = variable === v;
          return (
            <button key={String(v)} type="button" onClick={() => setVariable(v as boolean)} style={{ ...segBtn, ...(active ? segBtnActive : {}) }}>
              {t(`recurring.${label}`)}
            </button>
          );
        })}
      </div>

      {!variable && (
        <input style={fieldStyle} inputMode="decimal" placeholder={t("recurring.monthlyAmount")} value={amount} onChange={(e) => setAmount(e.target.value)} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span className="eyebrow">{t("recurring.dayOfMonth")}</span>
          <input style={fieldStyle} type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span className="eyebrow">{t("recurring.startMonth")}</span>
          <input style={fieldStyle} type="month" value={startMonth} onChange={(e) => setStartMonth(e.target.value)} />
        </label>
      </div>

      <div style={segWrap}>
        {METHOD_VALUES.map((v) => {
          const active = v === paymentMethod;
          return (
            <button key={v} type="button" onClick={() => setPaymentMethod(v)} style={{ ...segBtn, fontSize: 12.5, ...(active ? segBtnActive : {}) }}>
              {t(`method.${v}`)}
            </button>
          );
        })}
      </div>

      <button onClick={create} disabled={!canCreate || saving} style={{ ...confirmBtn, width: "100%", padding: 13, opacity: canCreate && !saving ? 1 : 0.55 }}>
        {t("recurring.create")}
      </button>
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", minWidth: 0, padding: "11px 13px", borderRadius: 12,
  border: "1px solid var(--color-border)", background: "var(--color-surface)",
  color: "var(--color-text)", outline: "none", fontSize: 15,
};
const confirmBtn: React.CSSProperties = {
  cursor: "pointer", padding: "9px 14px", borderRadius: 999, border: 0, fontSize: 13, fontWeight: 600,
  color: "var(--color-accent-contrast)", background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))",
  whiteSpace: "nowrap",
};
const ghostBtn: React.CSSProperties = {
  cursor: "pointer", padding: "9px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
  color: "var(--color-text-muted)", background: "transparent", border: "1px solid var(--color-border)", whiteSpace: "nowrap",
};
const dangerBtn: React.CSSProperties = { ...confirmBtn, background: "#c05b4d" };
const chip: React.CSSProperties = {
  cursor: "pointer", padding: "7px 13px", borderRadius: 999, fontSize: 13.5, fontWeight: 500,
  color: "var(--color-text)", background: "var(--color-surface)", border: "1px solid var(--color-border)",
};
const chipActive: React.CSSProperties = {
  color: "var(--color-accent-contrast)", fontWeight: 600,
  background: "linear-gradient(145deg, var(--color-accent), var(--color-accent-2))", border: "1px solid transparent",
};
const segWrap: React.CSSProperties = {
  display: "flex", gap: 4, padding: 4, borderRadius: 12, background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
};
const segBtn: React.CSSProperties = {
  flex: 1, cursor: "pointer", padding: "8px 4px", borderRadius: 9, border: 0, fontSize: 13, fontWeight: 500,
  color: "var(--color-text-muted)", background: "transparent",
};
const segBtnActive: React.CSSProperties = {
  color: "var(--color-text)", fontWeight: 600, background: "var(--color-surface)", boxShadow: "var(--shadow-sm)",
};
