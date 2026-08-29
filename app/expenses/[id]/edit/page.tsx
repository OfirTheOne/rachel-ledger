"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJSON, patchJSON } from "@/lib/api";
import { useT } from "@/app/ui/LanguageProvider";
import { ExpenseForm, type ExpenseInitial, type ExpensePayload } from "@/app/ui/ExpenseForm";

type Expense = {
  id: string; amountAgorot: number; date: string; shop: string; note: string | null;
  paymentMethod: string; category: { id: string };
};

export default function EditExpensePage() {
  const { t } = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [initial, setInitial] = useState<ExpenseInitial | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getJSON<Expense>(`/api/expenses/${id}`)
      .then((e) => setInitial({
        amount: (e.amountAgorot / 100).toFixed(2),
        date: e.date.slice(0, 10),
        shop: e.shop,
        note: e.note ?? "",
        categoryId: e.category.id,
        paymentMethod: e.paymentMethod,
      }))
      .catch(() => setNotFound(true));
  }, [id]);

  async function onSubmit(payload: ExpensePayload) {
    await patchJSON(`/api/expenses/${id}`, payload);
    router.push("/expenses");
  }

  if (notFound) {
    return <p style={{ color: "var(--color-text-muted)", padding: "8px 4px" }}>{t("edit.notFound")}</p>;
  }
  if (!initial) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 300, animationDelay: "0.1s" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="rise" style={{ padding: "0 4px" }}>
        <div className="eyebrow">{t("edit.eyebrow")}</div>
        <h1 style={{ fontSize: 27, marginTop: 4 }}>{t("edit.title")}</h1>
      </div>
      <ExpenseForm initial={initial} submitLabel={t("edit.save")} savingLabel={t("add.saving")} onSubmit={onSubmit} />
    </div>
  );
}
