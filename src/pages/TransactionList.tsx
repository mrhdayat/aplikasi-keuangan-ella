import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Pencil, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // 1. Fetch Transaksi (Query Lebih Simple)
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filterMonth, filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*') // Tidak perlu join projects/types lagi
        .eq('month', filterMonth)
        .eq('year', filterYear)
        .order('date', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Mutation: Quick Posting
  const postingMutation = useMutation({
    mutationFn: async (trx: any) => {
      if (trx.total_debit !== trx.total_credit) {
        throw new Error("Tidak seimbang.");
      }
      const { error } = await supabase.from('transactions').update({ status: 'POSTED' }).eq('id', trx.id); 
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Berhasil Posting!');
    },
    onError: (err: any) => toast.error('Gagal', { description: err.message })
  });

  // 3. Mutation: Delete
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

  const handleQuickPost = (trx: any) => {
    if (Math.abs(trx.total_debit - trx.total_credit) > 1) {
      toast.error('Selisih!', { description: 'Jurnal tidak balance.' });
      return;
    }
    toast('Posting transaksi ini?', {
      action: { label: 'Ya', onClick: () => postingMutation.mutate(trx) },
      cancel: { label: 'Batal', onClick: () => {} }
    });
  };

  const handleExport = () => {
    if (!transactions || transactions.length === 0) return toast.error('Kosong');
    // Header CSV Baru
    const headers = ['Tanggal', 'Uraian', 'Total', 'Status'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description}"`,
      t.total_debit,
      t.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Trx_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Jurnal Umum</h1>
          <p className="text-gray-500 text-sm">Daftar transaksi keuangan.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow">
            <Download size={18} /> Export
          </button>
           <Link to="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow">
            <Plus size={18} /> Input Jurnal
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Uraian</th>
                <th className="px-6 py-3 text-right">Total (Rp)</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? <tr><td colSpan={5} className="p-6 text-center">Loading...</td></tr> : 
              transactions?.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 whitespace-nowrap w-32">{trx.date}</td>
                  <td className="px-6 py-3">
                    <div className="text-gray-900">{trx.description}</div>
                    {Math.abs(trx.total_debit - trx.total_credit) > 1 && (
                      <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded flex items-center gap-1 w-fit mt-1"><AlertCircle size={10}/> TIDAK BALANCE</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-medium font-mono">{trx.total_debit?.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-3 text-center w-24">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${trx.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 flex justify-center gap-2 w-32">
                    {trx.status === 'DRAFT' && (
                      <button onClick={() => handleQuickPost(trx)} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Posting">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => navigate(`/transactions/${trx.id}/edit`)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => { 
                        toast('Hapus?', { action: { label: 'Hapus', onClick: () => deleteMutation.mutate(trx.id) }, cancel: { label: 'Batal', onClick: () => {} } }) 
                      }} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}