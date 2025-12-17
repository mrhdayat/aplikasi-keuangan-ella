import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Download, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BalanceSheetReport() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['balance_sheet', year],
    queryFn: async () => {
      // PERBAIKAN: Menggunakan parameter 'p_year'
      const { data, error } = await supabase.rpc('get_account_balances', { p_year: year });
      
      if (error) throw error;

      const revenue = data?.filter((d: any) => d.type === 'REVENUE').reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
      const expense = data?.filter((d: any) => d.type === 'EXPENSE').reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
      const currentEarnings = revenue - expense;

      return {
        assets: data?.filter((d: any) => d.type === 'ASSET') || [],
        liabilities: data?.filter((d: any) => d.type === 'LIABILITY') || [],
        equity: data?.filter((d: any) => d.type === 'EQUITY') || [],
        currentEarnings
      };
    }
  });

  const totalAssets = accounts?.assets.reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
  const totalLiabilities = accounts?.liabilities.reduce((sum: number, a: any) => sum + a.balance, 0) || 0;
  const totalEquity = (accounts?.equity.reduce((sum: number, a: any) => sum + a.balance, 0) || 0) + (accounts?.currentEarnings || 0);

  const handleExport = () => {
    let csv = `LAPORAN POSISI KEUANGAN (NERACA) TAHUN ${year}\n\n`;
    csv += "ASET\nKode,Nama,Saldo\n";
    accounts?.assets.forEach((a: any) => csv += `${a.code},"${a.name}",${a.balance}\n`);
    csv += `TOTAL ASET,,${totalAssets}\n\n`;
    
    csv += "KEWAJIBAN\nKode,Nama,Saldo\n";
    accounts?.liabilities.forEach((a: any) => csv += `${a.code},"${a.name}",${a.balance}\n`);
    csv += `TOTAL KEWAJIBAN,,${totalLiabilities}\n\n`;

    csv += "MODAL\nKode,Nama,Saldo\n";
    accounts?.equity.forEach((a: any) => csv += `${a.code},"${a.name}",${a.balance}\n`);
    csv += `Laba Tahun Berjalan,,${accounts?.currentEarnings}\n`;
    csv += `TOTAL MODAL,,${totalEquity}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Neraca_${year}.csv`;
    link.click();
  };

  const renderRow = (item: any) => (
    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 group transition">
      <td className="py-2 text-gray-600">{item.code}</td>
      <td className="py-2">
        <Link to={`/reports/ledger/${item.id}?year=${year}`} className="hover:text-blue-600 hover:underline flex gap-2 items-center text-gray-800">
           {item.name}
        </Link>
      </td>
      <td className="py-2 text-right font-medium">{item.balance.toLocaleString()}</td>
    </tr>
  );

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat Laporan...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm no-print">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <Building2 className="text-blue-600"/> Laporan Posisi Keuangan
           </h1>
           <p className="text-gray-500 text-sm">Neraca Perusahaan per Tahun {year}</p>
        </div>
        <div className="flex gap-2">
           <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-lg p-2 bg-gray-50 text-sm bg-white outline-none">
             <option value="2024">2024</option>
             <option value="2025">2025</option>
             <option value="2026">2026</option>
           </select>
           <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 shadow text-sm">
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ASET */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">ASET (HARTA)</h2>
          <table className="w-full text-sm">
            <tbody>{accounts?.assets.map(renderRow)}</tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={2} className="py-4 font-bold text-gray-800">TOTAL ASET</td>
                <td className="py-4 text-right font-bold text-blue-700 text-lg">{totalAssets.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* KEWAJIBAN & MODAL */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h2 className="text-lg font-bold text-red-800 border-b pb-2 mb-4">KEWAJIBAN (HUTANG)</h2>
            <table className="w-full text-sm">
              <tbody>{accounts?.liabilities.map(renderRow)}</tbody>
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
                {accounts?.equity.map(renderRow)}
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
          
          <div className={`p-4 rounded-lg text-center font-bold text-white ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? 'bg-green-600' : 'bg-red-600'}`}>
            {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
              ? "✓ NERACA SEIMBANG (BALANCE)" 
              : `⚠ TIDAK BALANCE (Selisih: ${(totalAssets - (totalLiabilities + totalEquity)).toLocaleString()})`}
          </div>
        </div>
      </div>
    </div>
  );
}