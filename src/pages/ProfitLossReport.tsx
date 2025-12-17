import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

export default function ProfitLossReport() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['profit_loss', year],
    queryFn: async () => {
      // PERBAIKAN: Menggunakan parameter 'p_year'
      const { data: rawData, error } = await supabase
        .rpc('get_account_balances', { p_year: year });
        
      if (error) throw error;

      const revenue = rawData?.filter((d: any) => d.type === 'REVENUE') || [];
      const expense = rawData?.filter((d: any) => d.type === 'EXPENSE') || [];

      return { revenue, expense };
    }
  });

  const renderRow = (item: any) => (
    <tr key={item.id} className="hover:bg-gray-50 group transition">
      <td className="py-2 text-gray-600 w-20">{item.code}</td>
      <td className="py-2 text-gray-800">
         <Link to={`/reports/ledger/${item.id}?year=${year}`} className="hover:text-blue-600 hover:underline flex gap-2 items-center">
           {item.name}
         </Link>
      </td>
      <td className="py-2 text-right font-medium text-gray-700">{item.balance.toLocaleString()}</td>
    </tr>
  );

  const totalRevenue = data?.revenue.reduce((sum: number, item: any) => sum + item.balance, 0) || 0;
  const totalExpense = data?.expense.reduce((sum: number, item: any) => sum + item.balance, 0) || 0;
  const netProfit = totalRevenue - totalExpense;

  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    if (!element) return toast.error('Elemen tidak ditemukan');

    const opt: any = { 
      margin: 10,
      filename: `Laba_Rugi_${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadExcel = () => {
    let csv = `LAPORAN LABA RUGI TAHUN ${year}\n\nPENDAPATAN\nKode,Nama,Jumlah\n`;
    data?.revenue.forEach((i:any) => csv += `${i.code},"${i.name}",${i.balance}\n`);
    csv += `TOTAL PENDAPATAN,,${totalRevenue}\n\nBEBAN\nKode,Nama,Jumlah\n`;
    data?.expense.forEach((i:any) => csv += `${i.code},"${i.name}",${i.balance}\n`);
    csv += `TOTAL BEBAN,,${totalExpense}\n\nLABA BERSIH,,${netProfit}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `LabaRugi_${year}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h1>
          <p className="text-gray-500 text-sm">Periode Tahun {year}</p>
        </div>
        <div className="flex gap-2">
           <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded-lg p-2 text-sm bg-gray-50 outline-none">
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow text-sm">
            <FileDown size={18} /> PDF
          </button>
          <button onClick={handleDownloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow text-sm">
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
      </div>

      <div id="report-content" className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest">Mining Support & General Supply</h2>
          <h3 className="text-lg font-semibold text-gray-600">LAPORAN LABA RUGI</h3>
          <p className="text-sm text-gray-500 mt-1">Periode Berakhir 31 Desember {year}</p>
        </div>

        {isLoading ? <div className="text-center py-10">Loading...</div> : (
          <div className="space-y-8">
            <div>
              <h4 className="font-bold text-blue-800 mb-3 border-b border-blue-100 pb-1">PENDAPATAN USAHA</h4>
              <table className="w-full text-sm">
                <tbody>{data?.revenue.map(renderRow)}</tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={2} className="py-3 font-bold pl-4">Total Pendapatan</td>
                    <td className="py-3 text-right font-bold text-blue-700">{totalRevenue.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div>
              <h4 className="font-bold text-red-800 mb-3 border-b border-red-100 pb-1">BEBAN OPERASIONAL</h4>
              <table className="w-full text-sm">
                <tbody>{data?.expense.map(renderRow)}</tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={2} className="py-3 font-bold pl-4">Total Beban</td>
                    <td className="py-3 text-right font-bold text-red-700">({totalExpense.toLocaleString()})</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-gray-800 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div><h4 className="text-lg font-bold">LABA BERSIH</h4></div>
              <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {netProfit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}