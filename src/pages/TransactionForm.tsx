import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { transactionSchema, type TransactionFormValues } from '../features/finance/schema';
import { toast } from 'sonner';

export default function TransactionForm() {
  const { id } = useParams(); 
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch Master Akun
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, code, name').eq('is_active', true).order('code');
      return data || [];
    }
  });

  // Fetch Data (Edit Mode)
  const { data: existingData } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, journal_entries(*)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditMode 
  });

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      status: 'DRAFT' as const,
      journal_entries: [
        { account_id: '', debit: 0, credit: 0, line_description: '' },
        { account_id: '', debit: 0, credit: 0, line_description: '' }
      ]
    }
  });

  useEffect(() => {
    if (existingData) {
      form.reset({
        date: existingData.date,
        description: existingData.description || '',
        status: existingData.status as 'DRAFT' | 'POSTED',
        journal_entries: existingData.journal_entries.map((j: any) => ({
          account_id: j.account_id,
          debit: j.debit,
          credit: j.credit,
          line_description: j.line_description || ''
        }))
      });
    }
  }, [existingData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "journal_entries"
  });

  const watchedEntries = form.watch("journal_entries");
  const totalDebit = watchedEntries.reduce((sum, val) => sum + (Number(val.debit) || 0), 0);
  const totalCredit = watchedEntries.reduce((sum, val) => sum + (Number(val.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

  const mutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      let trxId = id;

      const payload = {
        date: data.date,
        description: data.description,
        status: data.status,
        total_debit: totalDebit,
        total_credit: totalCredit,
      };

      if (isEditMode) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data: newTrx, error } = await supabase.from('transactions').insert(payload).select().single();
        if (error) throw error;
        trxId = newTrx.id;
      }

      if (isEditMode) {
        await supabase.from('journal_entries').delete().eq('transaction_id', trxId);
      }

      const entries = data.journal_entries.map(e => ({
        transaction_id: trxId,
        account_id: e.account_id,
        debit: e.debit,
        credit: e.credit,
        line_description: e.line_description || data.description
      }));

      const { error: detailError } = await supabase.from('journal_entries').insert(entries);
      if (detailError) throw detailError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // LOGIKA BARU DI SINI:
      if (isEditMode) {
        // Jika Edit, kembali ke list (karena biasanya selesai edit kita mau lihat hasilnya)
        navigate('/transactions');
        toast.success('Transaksi diperbarui!');
      } else {
        // Jika Input Baru, TETAP DI HALAMAN INI dan RESET FORM
        toast.success('Transaksi disimpan! Siap input berikutnya.');
        
        // Reset form ke kondisi awal (kosong)
        form.reset({
          date: form.getValues('date'), // Tanggal tidak direset biar cepat input hari yang sama
          description: '',
          status: 'DRAFT',
          journal_entries: [
            { account_id: '', debit: 0, credit: 0, line_description: '' },
            { account_id: '', debit: 0, credit: 0, line_description: '' }
          ]
        });
        // Scroll ke atas agar user sadar form sudah baru
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    onError: (error: any) => toast.error(`Gagal: ${error.message}`)
  });

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg mt-6">
      <div className="border-b pb-4 mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Jurnal Umum' : 'Input Jurnal Umum'}</h2>
        {/* Tombol kembali manual jika user ingin batal */}
        <button onClick={() => navigate('/transactions')} className="text-sm text-gray-500 hover:text-gray-700">
          Kembali ke List
        </button>
      </div>

      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tanggal</label>
            <input type="date" {...form.register('date')} className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
            {form.formState.errors.date && <p className="text-red-500 text-xs">{form.formState.errors.date.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Uraian / Keterangan</label>
            <input {...form.register('description')} placeholder="Contoh: Pembayaran Listrik" className="w-full border rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
            {form.formState.errors.description && <p className="text-red-500 text-xs">{form.formState.errors.description.message}</p>}
          </div>
        </div>

        <div className="border rounded-md overflow-hidden bg-gray-50/50">
          <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">Detail Debit / Kredit</h3>
            <button type="button" onClick={() => append({ account_id: '', debit: 0, credit: 0, line_description: '' })} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">
              + Tambah Baris
            </button>
          </div>
          <div className="p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="p-2 w-1/3">Akun</th>
                  <th className="p-2">Keterangan (Opsional)</th>
                  <th className="p-2 w-1/6 text-right">Debit</th>
                  <th className="p-2 w-1/6 text-right">Kredit</th>
                  <th className="p-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id}>
                    <td className="p-2">
                      <select {...form.register(`journal_entries.${index}.account_id` as const)} className="w-full border rounded p-2 bg-white outline-none focus:border-blue-500">
                        <option value="">Pilih Akun...</option>
                        {accounts?.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                      </select>
                    </td>
                    <td className="p-2"><input {...form.register(`journal_entries.${index}.line_description` as const)} className="w-full border rounded p-2 outline-none focus:border-blue-500" /></td>
                    <td className="p-2"><input type="number" {...form.register(`journal_entries.${index}.debit` as const)} className="w-full border rounded p-2 text-right outline-none focus:border-blue-500" /></td>
                    <td className="p-2"><input type="number" {...form.register(`journal_entries.${index}.credit` as const)} className="w-full border rounded p-2 text-right outline-none focus:border-blue-500" /></td>
                    <td className="p-2 text-center"><button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 font-bold">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded border gap-4">
          <div className="text-sm space-y-1">
             <div className="flex gap-4">
                <span>Total Debit: <span className="font-mono font-bold">{totalDebit.toLocaleString()}</span></span>
                <span>Total Kredit: <span className="font-mono font-bold">{totalCredit.toLocaleString()}</span></span>
             </div>
             <div className={isBalanced ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                {isBalanced ? "✓ SEIMBANG" : `⚠ SELISIH: ${(totalDebit - totalCredit).toLocaleString()}`}
             </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select {...form.register('status')} className="border rounded p-2 bg-white">
               <option value="DRAFT">Simpan DRAFT</option>
               <option value="POSTED" disabled={!isBalanced}>POSTING FINAL</option>
            </select>
            <button type="submit" disabled={mutation.isPending} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex-1 md:flex-none">
              {mutation.isPending ? 'Proses...' : (isEditMode ? 'Update' : 'Simpan & Baru')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}