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

  // 1. Fetch Transaksi
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filterMonth, filterYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, transaction_types (name), projects (name)`)
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
        throw new Error("Transaksi tidak seimbang (Debit != Kredit). Silakan edit manual.");
      }
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'POSTED' })
        .eq('id', trx.id); 
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaksi berhasil di-POSTING!');
    },
    onError: (err: any) => {
      toast.error('Gagal Posting', { description: err.message });
    }
  });

  // 3. Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaksi dihapus');
    }
  });

  // 4. Logic Tombol
  const handleQuickPost = (trx: any) => {
    if (Math.abs(trx.total_debit - trx.total_credit) > 1) {
      toast.error('Tidak bisa Posting!', {
        description: `Selisih Rp ${(trx.total_debit - trx.total_credit).toLocaleString()}. Harap edit dan seimbangkan jurnal.`,
        icon: <AlertCircle className="text-red-500" />
      });
      return;
    }

    toast('Posting transaksi ini?', {
      description: 'Status akan berubah menjadi Final.',
      action: {
        label: 'Ya, Posting',
        onClick: () => postingMutation.mutate(trx)
      },
      cancel: { 
        label: 'Batal',
        onClick: () => {} // <-- FIX: Harus ada fungsi kosong minimal
      }
    });
  };

  const handleDelete = (id: string) => {
    toast('Hapus data transaksi ini?', { 
      action: { 
        label: 'Hapus', 
        onClick: () => deleteMutation.mutate(id) 
      }, 
      cancel: { 
        label: 'Batal',
        onClick: () => {} // <-- FIX: Harus ada fungsi kosong minimal
      } 
    });
  };

  const handleExport = () => {
    if (!transactions || transactions.length === 0) return toast.error('Tidak ada data untuk diexport');

    const headers = ['Tanggal', 'No Bukti', 'Keterangan', 'Tipe', 'Proyek', 'Total Debit', 'Status'];
    const rows = transactions.map(t => [
      t.date,
      t.voucher_number,
      `"${t.description}"`,
      t.transaction_types?.name || '-',
      t.projects?.name || '-',
      t.total_debit,
      t.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Transaksi_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Transaksi</h1>
          <p className="text-gray-500 text-sm">Kelola data keuangan harian.</p>
        </div>
        <div className="flex gap-2">
           {/* FIX: Tombol Export Ditambahkan Kembali */}
           <button 
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition shadow"
          >
            <Download size={18} /> Export CSV
          </button>

           <Link to="/transactions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow">
            <Plus size={18} /> Input Baru
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex gap-4 items-center">
        <span className="text-sm font-medium text-gray-600">Periode:</span>
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">No Bukti</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3 text-right">Total (Rp)</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? <tr><td colSpan={6} className="p-6 text-center">Loading...</td></tr> : 
              transactions?.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 whitespace-nowrap">{trx.date}</td>
                  <td className="px-6 py-3 font-mono text-xs">{trx.voucher_number}</td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-gray-900">{trx.transaction_types?.name}</div>
                    <div className="text-gray-500 text-xs truncate max-w-xs">{trx.description}</div>
                    {Math.abs(trx.total_debit - trx.total_credit) > 1 && (
                      <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded">TIDAK BALANCE</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-medium">{trx.total_debit?.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${trx.status === 'POSTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 flex justify-center gap-2">
                    {trx.status === 'DRAFT' && (
                      <button 
                        onClick={() => handleQuickPost(trx)}
                        className="p-1.5 text-green-600 hover:bg-green-100 rounded transition" 
                        title="Posting Transaksi (Final)"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => navigate(`/transactions/${trx.id}/edit`)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition" title="Edit">
                      <Pencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(trx.id)} 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Hapus"
                    >
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