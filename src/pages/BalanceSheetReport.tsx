import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Download, Building2 } from 'lucide-react';

export default function BalanceSheetReport() {
  const [year] = useState(new Date().getFullYear());

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['balance_sheet', year],
    queryFn: async () => {
      // 1. Ambil Saldo Akun (Harta, Hutang, Modal)
      const { data: balanceData } = await supabase.from('view_account_balances')
        .select('*').in('type', ['ASSET', 'LIABILITY', 'EQUITY']);
      
      // 2. Hitung Laba Rugi Tahun Berjalan (Total Revenue - Expense)
      const { data: plData } = await supabase.from('view_account_balances')
        .select('*').in('type', ['REVENUE', 'EXPENSE']);
      
      const revenue = plData?.filter(a => a.type === 'REVENUE').reduce((sum, a) => sum + a.balance, 0) || 0;
      const expense = plData?.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0) || 0;
      const currentEarnings = revenue - expense;

      return {
        assets: balanceData?.filter(a => a.type === 'ASSET') || [],
        liabilities: balanceData?.filter(a => a.type === 'LIABILITY') || [],
        equity: balanceData?.filter(a => a.type === 'EQUITY') || [],
        currentEarnings
      };
    }
  });

  const totalAssets = accounts?.assets.reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalLiabilities = accounts?.liabilities.reduce((sum, a) => sum + a.balance, 0) || 0;
  const totalEquity = (accounts?.equity.reduce((sum, a) => sum + a.balance, 0) || 0) + (accounts?.currentEarnings || 0);

  const handleExport = () => {
    let csv = "LAPORAN POSISI KEUANGAN (NERACA)\n\n";
    csv += "ASET\n";
    accounts?.assets.forEach(a => csv += `${a.code},${a.name},${a.balance}\n`);
    csv += `TOTAL ASET,,${totalAssets}\n\n`;
    
    csv += "KEWAJIBAN\n";
    accounts?.liabilities.forEach(a => csv += `${a.code},${a.name},${a.balance}\n`);
    csv += `TOTAL KEWAJIBAN,,${totalLiabilities}\n\n`;

    csv += "MODAL\n";
    accounts?.equity.forEach(a => csv += `${a.code},${a.name},${a.balance}\n`);
    csv += `Laba Tahun Berjalan,,${accounts?.currentEarnings}\n`;
    csv += `TOTAL MODAL,,${totalEquity}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Neraca_${year}.csv`;
    link.click();
  };

  if (isLoading) return <div className="p-8 text-center">Loading Laporan...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center no-print">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Building2 className="text-blue-600"/> Laporan Posisi Keuangan
           </h1>
           <p className="text-gray-500 text-sm">Neraca Perusahaan per Tahun {year}</p>
        </div>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow">
          <Download size={18} /> Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* KOLOM KIRI: ASET */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">ASET (HARTA)</h2>
          <table className="w-full text-sm">
            <tbody>
              {accounts?.assets.map(a => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 text-gray-600">{a.code}</td>
                  <td className="py-2">{a.name}</td>
                  <td className="py-2 text-right font-medium">{a.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={2} className="py-4 font-bold text-gray-800">TOTAL ASET</td>
                <td className="py-4 text-right font-bold text-blue-700 text-lg">{totalAssets.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* KOLOM KANAN: KEWAJIBAN & MODAL */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold text-red-800 border-b pb-2 mb-4">KEWAJIBAN (HUTANG)</h2>
            <table className="w-full text-sm">
              <tbody>
                {accounts?.liabilities.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-600">{a.code}</td>
                    <td className="py-2">{a.name}</td>
                    <td className="py-2 text-right font-medium">{a.balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={2} className="py-3 font-bold text-gray-800">TOTAL KEWAJIBAN</td>
                  <td className="py-3 text-right font-bold text-gray-800">{totalLiabilities.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold text-purple-800 border-b pb-2 mb-4">MODAL (EKUITAS)</h2>
            <table className="w-full text-sm">
              <tbody>
                {accounts?.equity.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-600">{a.code}</td>
                    <td className="py-2">{a.name}</td>
                    <td className="py-2 text-right font-medium">{a.balance.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-yellow-50">
                  <td className="py-2 text-gray-600">3999</td>
                  <td className="py-2 font-bold text-yellow-800">Laba Tahun Berjalan</td>
                  <td className="py-2 text-right font-bold text-yellow-800">{accounts?.currentEarnings.toLocaleString()}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={2} className="py-4 font-bold text-gray-800">TOTAL MODAL</td>
                  <td className="py-4 text-right font-bold text-purple-700 text-lg">{totalEquity.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className={`p-4 rounded-lg text-center font-bold text-white ${totalAssets === (totalLiabilities + totalEquity) ? 'bg-green-600' : 'bg-red-600'}`}>
            {totalAssets === (totalLiabilities + totalEquity) 
              ? "✓ NERACA SEIMBANG (BALANCE)" 
              : `⚠ TIDAK BALANCE (Selisih: ${(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()})`}
          </div>
        </div>
      </div>
    </div>
  );
}