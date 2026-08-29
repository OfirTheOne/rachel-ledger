import { z } from "zod";

const paymentMethods = ["Cash","Credit","Debit","BankTransfer","Other"] as const;

export const expenseCreateSchema = z.object({
  amountAgorot: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().min(1),
  shop: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(paymentMethods),
});
export const expenseUpdateSchema = expenseCreateSchema.partial();

// A bilingual name: either language may be blank, but not both. Blank strings
// are normalized to null so an omitted language is stored as NULL.
const optName = z
  .string()
  .max(40)
  .transform((s) => s.trim())
  .transform((s) => (s === "" ? null : s))
  .nullable()
  .optional();

export const categoryCreateSchema = z
  .object({ nameEn: optName, nameHe: optName })
  .refine((d) => !!(d.nameEn || d.nameHe), { message: "At least one name is required" });

export const categoryUpdateSchema = z
  .object({ nameEn: optName, nameHe: optName, archived: z.boolean().optional() })
  .refine((d) => d.archived !== undefined || d.nameEn !== undefined || d.nameHe !== undefined, {
    message: "Nothing to update",
  });

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const installmentCreateSchema = z.object({
  totalAgorot: z.number().int().positive(),
  count: z.number().int().min(2).max(120),
  startDate: dateStr,
  categoryId: z.string().min(1),
  shop: z.string().min(1).max(120),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(paymentMethods),
});

export const recurringCreateSchema = z.object({
  name: z.string().min(1).max(120),
  categoryId: z.string().min(1),
  paymentMethod: z.enum(paymentMethods),
  // null / omitted => variable (unknown) amount, entered at confirm time
  amountAgorot: z.number().int().positive().nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  startMonth: dateStr,
});
export const recurringUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  categoryId: z.string().min(1).optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  amountAgorot: z.number().int().positive().nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  active: z.boolean().optional(),
});

export const occurrenceConfirmSchema = z.object({
  amountAgorot: z.number().int().positive(),
  date: dateStr,
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type InstallmentCreateInput = z.infer<typeof installmentCreateSchema>;
export type RecurringCreateInput = z.infer<typeof recurringCreateSchema>;
export type RecurringUpdateInput = z.infer<typeof recurringUpdateSchema>;
