import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filterMonth, filterYear],
    queryFn: async () => {
      // Mengambil transaksi BESERTA detail jurnal dan nama akunnya
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          journal_entries (
            debit, 
            credit,
            accounts (code, name)
          )
        `)
        .eq('month', filterMonth)
        .eq('year', filterYear)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const postingMutation = useMutation({
    mutationFn: async (trx: any) => {
      if (trx.total_debit !== trx.total_credit) throw new Error("Tidak seimbang.");
      const { error } = await supabase.from('transactions').update({ status: 'POSTED' }).eq('id', trx.id); 
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Berhasil Posting!');
    },
    onError: (err: any) => toast.error('Gagal', { description: err.message })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Dihapus');
    }
  });

  // Fitur Export ke CSV/Excel
  const handleExport = () => {
    if (!transactions || transactions.length === 0) return toast.error('Data kosong');
    
    let csvContent = "Tanggal,No Bukti,Uraian,Akun,Debit,Kredit,Status\n";

    transactions.forEach(t => {
      // Loop detail jurnal agar setiap baris akun muncul di Excel
      t.journal_entries.forEach((je: any) => {
        const row = [
          t.date,
          t.voucher_number || '-',
          `"${t.description}"`, // Pakai kutip biar aman koma
          `"${je.accounts?.code || ''} - ${je.accounts?.name || ''}"`, 
          je.debit,
          je.credit,
          t.status
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Jurnal_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Daftar Jurnal</h1>
           <p className="text-gray-500 text-sm">Monitoring transaksi harian.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow">
            <Download size={18} /> Export Excel
          </button>
           <Link to="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow">
            <Plus size={18} /> Input Baru
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center">
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border rounded p-2 text-sm outline-none">
          {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border rounded p-2 text-sm outline-none">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
            <tr>
              <th className="px-6 py-3">Tanggal / Uraian</th>
              <th className="px-6 py-3">Detail Jurnal</th>
              <th className="px-6 py-3 text-right">Nominal</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr> : 
            transactions?.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-400">Belum ada data.</td></tr> :
            transactions?.map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50 transition align-top">
                <td className="px-6 py-4 w-1/4">
                  <div className="font-bold text-gray-900">{trx.date}</div>
                  <div className="text-gray-500 text-xs mt-1">{trx.voucher_number}</div>
                  <div className="text-gray-700 mt-2 italic">"{trx.description}"</div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${trx.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {trx.status}
                  </span>
                </td>
                
                {/* Menampilkan Detail Akun tanpa harus klik */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {trx.journal_entries?.map((je: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs border-b border-gray-100 pb-1 last:border-0">
                        <span className={`${je.credit > 0 ? 'pl-4 text-gray-500' : 'text-blue-700 font-medium'}`}>
                          {je.accounts?.code} - {je.accounts?.name}
                        </span>
                        <span className="font-mono">
                          {je.debit > 0 ? `(D) ${je.debit.toLocaleString()}` : `(K) ${je.credit.toLocaleString()}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </td>

                <td className="px-6 py-4 text-right font-bold text-gray-800">
                  {trx.total_debit?.toLocaleString('id-ID')}
                </td>

                <td className="px-6 py-4 flex flex-col gap-2 items-center justify-center">
                  {trx.status === 'DRAFT' && (
                    <button onClick={() => postingMutation.mutate(trx)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded" title="Posting">
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button onClick={() => navigate(`/transactions/${trx.id}/edit`)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => { 
                      if(confirm('Hapus transaksi?')) deleteMutation.mutate(trx.id); 
                    }} 
                    className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded" title="Hapus">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}