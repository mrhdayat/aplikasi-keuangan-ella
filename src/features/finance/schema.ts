import { z } from 'zod';

export const journalEntrySchema = z.object({
  account_id: z.string().min(1, "Akun wajib dipilih"),
  line_description: z.string().optional(),
  debit: z.coerce.number().min(0),
  credit: z.coerce.number().min(0),
});

export const transactionSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  // HAPUS: voucher_number, transaction_type_id, project_id
  description: z.string().min(1, "Uraian wajib diisi"),
  status: z.enum(['DRAFT', 'POSTED']),
  journal_entries: z.array(journalEntrySchema).min(2, "Minimal 2 baris jurnal (Debit & Kredit)"),
}).refine((data) => {
  if (data.status === 'POSTED') {
    const totalDebit = data.journal_entries.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.journal_entries.reduce((sum, item) => sum + item.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 1; 
  }
  return true;
}, {
  message: "Jurnal tidak seimbang (Balance tidak 0)",
  path: ["status"], 
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;