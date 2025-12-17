import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Download } from 'lucide-react';

export default function TrialBalance() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['trial_balance'],
    queryFn: async () => {
      const { data, error } = await supabase.from('view_account_balances').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const handleExport = () => {
    if (!accounts) return;
    const headers = ['Kode Akun', 'Nama Akun', 'Tipe', 'Saldo Akhir'];
    const rows = accounts.map(a => [a.code, `"${a.name}"`, a.type, a.balance]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NeracaSaldo.csv`;
    link.click();
  };

  const totalAsset = accounts?.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalLiability = accounts?.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalEquity = accounts?.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Neraca Saldo</h1>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow">
          <Download size={18} /> Export
        </button>
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
            accounts?.map((acc) => (
              <tr key={acc.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-gray-600">{acc.code}</td>
                <td className="px-6 py-3 font-medium text-gray-800">{acc.name}</td>
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