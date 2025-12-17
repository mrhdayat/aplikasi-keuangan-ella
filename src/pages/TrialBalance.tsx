import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Download, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrialBalance() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['trial_balance', year],
    queryFn: async () => {
      // PERBAIKAN: Menggunakan parameter 'p_year'
      const { data, error } = await supabase
        .rpc('get_account_balances', { p_year: year });
        
      if (error) {
        console.error("RPC Error:", error);
        throw error;
      }
      return data || [];
    }
  });

  const handleExport = () => {
    if (!accounts) return;
    const headers = ['Kode Akun', 'Nama Akun', 'Tipe', 'Saldo Akhir'];
    const rows = accounts.map((a: any) => [a.code, `"${a.name}"`, a.type, a.balance]);
    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NeracaSaldo_${year}.csv`;
    link.click();
  };

  const totalAsset = accounts?.filter((a: any) => a.type === 'ASSET').reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
  const totalLiability = accounts?.filter((a: any) => a.type === 'LIABILITY').reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
  const totalEquity = accounts?.filter((a: any) => a.type === 'EQUITY').reduce((sum: number, a: any) => sum + a.balance, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="text-indigo-600"/> Neraca Saldo
          </h1>
          <p className="text-sm text-gray-500">Klik nama akun untuk melihat Buku Besar.</p>
        </div>
        
        <div className="flex gap-2">
           <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-lg p-2 bg-gray-50 outline-none">
             <option value="2024">2024</option>
             <option value="2025">2025</option>
             <option value="2026">2026</option>
           </select>
           <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
           <p className="text-xs text-blue-500 uppercase font-bold">Total Aset</p>
           <p className="text-xl font-bold text-blue-800">Rp {totalAsset.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
           <p className="text-xs text-red-500 uppercase font-bold">Total Kewajiban</p>
           <p className="text-xl font-bold text-red-800">Rp {totalLiability.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
           <p className="text-xs text-purple-500 uppercase font-bold">Total Modal</p>
           <p className="text-xl font-bold text-purple-800">Rp {totalEquity.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold">
            <tr>
              <th className="px-6 py-3">Kode</th>
              <th className="px-6 py-3">Nama Akun</th>
              <th className="px-6 py-3">Tipe</th>
              <th className="px-6 py-3 text-right">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr> :
            accounts?.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-400">Belum ada data. Cek input jurnal.</td></tr> :
            accounts?.map((acc: any) => (
              <tr key={acc.id} className="hover:bg-gray-50 group transition">
                <td className="px-6 py-3 font-mono text-gray-600">{acc.code}</td>
                <td className="px-6 py-3 font-medium text-gray-800">
                  <Link 
                    to={`/reports/ledger/${acc.id}?year=${year}`} 
                    className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-2"
                  >
                    {acc.name}
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400 border border-gray-200 px-1 rounded bg-white">
                      Lihat Detail ↗
                    </span>
                  </Link>
                </td>
                <td className="px-6 py-3 text-xs">
                  <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">{acc.type}</span>
                </td>
                <td className={`px-6 py-3 text-right font-mono font-bold ${acc.balance < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {acc.balance.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}