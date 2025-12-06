import { z } from 'zod';

export const journalEntrySchema = z.object({
  account_id: z.string().min(1, "Akun wajib dipilih"),
  line_description: z.string().optional(),
  debit: z.coerce.number().min(0),
  credit: z.coerce.number().min(0),
});

export const transactionSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  voucher_number: z.string().min(1, "No Bukti wajib diisi"),
  description: z.string().min(1, "Uraian wajib diisi"),
  transaction_type_id: z.string().min(1, "Jenis transaksi wajib dipilih"),
  project_id: z.string().optional(), // Boleh null jika operasional kantor
  status: z.enum(['DRAFT', 'POSTED']),
  journal_entries: z.array(journalEntrySchema).min(2, "Minimal 2 baris jurnal"),
}).refine((data) => {
  if (data.status === 'POSTED') {
    const totalDebit = data.journal_entries.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.journal_entries.reduce((sum, item) => sum + item.credit, 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // Toleransi floating point
  }
  return true;
}, {
  message: "Total Debit dan Kredit harus seimbang untuk Posting",
  path: ["status"], // Error muncul di field status
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;