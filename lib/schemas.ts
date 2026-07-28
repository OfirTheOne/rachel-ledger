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

export const categoryCreateSchema = z.object({ name: z.string().min(1).max(40) });
export const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  archived: z.boolean().optional(),
});

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
