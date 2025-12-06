import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { transactionSchema, type TransactionFormValues } from '../features/finance/schema';
import { toast } from 'sonner';

export default function TransactionForm() {
  const { id } = useParams(); // Ambil ID dari URL (jika ada)
  const isEditMode = !!id;
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch Master Data
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('id, code, name').eq('is_active', true).order('code');
      return data || [];
    }
  });

  const { data: types } = useQuery({
    queryKey: ['types'],
    queryFn: async () => {
      const { data } = await supabase.from('transaction_types').select('*');
      return data || [];
    }
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('*').eq('status', 'BERJALAN');
      return data || [];
    }
  });

  // 2. Fetch Existing Data (Jika Edit Mode)
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
    enabled: isEditMode // Hanya jalan kalau ada ID
  });

  // 3. Setup Form
  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      voucher_number: '',
      description: '',
      transaction_type_id: '',
      project_id: '', 
      status: 'DRAFT' as const,
      journal_entries: [
        { account_id: '', debit: 0, credit: 0, line_description: '' },
        { account_id: '', debit: 0, credit: 0, line_description: '' }
      ]
    }
  });

  // Populate Form saat data edit tersedia
  useEffect(() => {
    if (existingData) {
      form.reset({
        date: existingData.date,
        voucher_number: existingData.voucher_number,
        description: existingData.description || '',
        transaction_type_id: existingData.transaction_type_id || '',
        project_id: existingData.project_id || '',
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

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "journal_entries"
  });

  const watchedEntries = form.watch("journal_entries");
  const selectedTypeId = form.watch("transaction_type_id");
  const totalDebit = watchedEntries.reduce((sum, val) => sum + (Number(val.debit) || 0), 0);
  const totalCredit = watchedEntries.reduce((sum, val) => sum + (Number(val.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 1;

  // Auto-fill logic (Hanya jalan jika BUKAN edit mode)
  useEffect(() => {
    if (!isEditMode && selectedTypeId && types) {
      const selectedType = types.find(t => t.id === selectedTypeId);
      if (selectedType && (selectedType.default_debit_account_id || selectedType.default_credit_account_id)) {
        const isFresh = watchedEntries.length === 2 && watchedEntries.every(e => !e.account_id && e.debit === 0);
        if (isFresh) {
          replace([
            { account_id: selectedType.default_debit_account_id || '', debit: 0, credit: 0, line_description: '' },
            { account_id: selectedType.default_credit_account_id || '', debit: 0, credit: 0, line_description: '' }
          ]);
        }
      }
    }
  }, [selectedTypeId, types, replace, isEditMode]);

  // 4. Mutation (Save / Update)
  const mutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      let trxId = id;

      // A. HEADER TRANSACTION
      const payload = {
        date: data.date,
        voucher_number: data.voucher_number,
        description: data.description,
        transaction_type_id: data.transaction_type_id,
        project_id: data.project_id || null,
        status: data.status,
        total_debit: totalDebit,
        total_credit: totalCredit,
      };

      if (isEditMode) {
        // UPDATE
        const { error } = await supabase.from('transactions').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        // INSERT
        const { data: newTrx, error } = await supabase.from('transactions').insert(payload).select().single();
        if (error) throw error;
        trxId = newTrx.id;
      }

      // B. JOURNAL ENTRIES (Hapus lama, insert baru - strategi paling aman)
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
      navigate('/transactions');
      
      // GANTI ALERT DENGAN TOAST
      toast.success(isEditMode ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil disimpan!', {
        description: 'Data keuangan telah tersinkronisasi.',
        duration: 4000, // Muncul selama 4 detik
      });
    },
    onError: (error: any) => {
      // GANTI ALERT DENGAN TOAST ERROR
      toast.error('Gagal menyimpan transaksi', {
        description: error.message,
      });
    }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white shadow-md rounded-lg mt-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Transaksi' : 'Input Transaksi Baru'}</h2>
      </div>

      <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* HEADER FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tanggal</label>
            <input type="date" {...form.register('date')} className="w-full border rounded-md p-2 mt-1" />
            {form.formState.errors.date && <p className="text-red-500 text-xs">{form.formState.errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">No. Bukti</label>
            <input {...form.register('voucher_number')} className="w-full border rounded-md p-2 mt-1" />
            {form.formState.errors.voucher_number && <p className="text-red-500 text-xs">{form.formState.errors.voucher_number.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jenis Transaksi</label>
            <select {...form.register('transaction_type_id')} className="w-full border rounded-md p-2 mt-1">
              <option value="">-- Pilih --</option>
              {types?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {form.formState.errors.transaction_type_id && <p className="text-red-500 text-xs">{form.formState.errors.transaction_type_id.message}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Uraian</label>
            <input {...form.register('description')} className="w-full border rounded-md p-2 mt-1" />
            {form.formState.errors.description && <p className="text-red-500 text-xs">{form.formState.errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Proyek</label>
            <select {...form.register('project_id')} className="w-full border rounded-md p-2 mt-1">
              <option value="">-- Operasional Kantor --</option>
              {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* DETAIL JURNAL */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b flex justify-between">
            <h3 className="font-semibold text-gray-700">Detail Jurnal</h3>
            <button type="button" onClick={() => append({ account_id: '', debit: 0, credit: 0, line_description: '' })} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
              + Tambah Baris
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 w-1/3">Akun</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3 w-1/6 text-right">Debit</th>
                <th className="p-3 w-1/6 text-right">Kredit</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-b">
                  <td className="p-2">
                    <select {...form.register(`journal_entries.${index}.account_id` as const)} className="w-full border rounded p-1">
                      <option value="">Pilih Akun...</option>
                      {accounts?.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input {...form.register(`journal_entries.${index}.line_description` as const)} className="w-full border rounded p-1" /></td>
                  <td className="p-2"><input type="number" {...form.register(`journal_entries.${index}.debit` as const)} className="w-full border rounded p-1 text-right" /></td>
                  <td className="p-2"><input type="number" {...form.register(`journal_entries.${index}.credit` as const)} className="w-full border rounded p-1 text-right" /></td>
                  <td className="p-2 text-center"><button type="button" onClick={() => remove(index)} className="text-red-500">✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded border">
          <div className="text-sm">
             <div>Debit: <span className="font-bold">{totalDebit.toLocaleString()}</span> | Kredit: <span className="font-bold">{totalCredit.toLocaleString()}</span></div>
             <div className={isBalanced ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{isBalanced ? "SEIMBANG" : "TIDAK SEIMBANG"}</div>
          </div>
          <div className="flex gap-2">
            <select {...form.register('status')} className="border rounded p-2">
               <option value="DRAFT">DRAFT</option>
               <option value="POSTED" disabled={!isBalanced}>POSTING</option>
            </select>
            <button type="submit" disabled={mutation.isPending} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Menyimpan...' : (isEditMode ? 'Update Transaksi' : 'Simpan Transaksi')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}