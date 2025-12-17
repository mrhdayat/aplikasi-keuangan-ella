import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { FileDown, FileSpreadsheet } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

export default function ProfitLossReport() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['profit_loss', year],
    queryFn: async () => {
      const { data: rawData, error } = await supabase
        .from('view_financial_report')
        .select('*')
        .eq('year', year);
        
      if (error) throw error;

      const revenue = rawData?.filter((d: any) => d.account_type === 'REVENUE') || [];
      const expense = rawData?.filter((d: any) => d.account_type === 'EXPENSE') || [];

      const revenueGrouped = Object.values(revenue.reduce((acc: any, curr: any) => {
        if (!acc[curr.account_code]) {
          acc[curr.account_code] = { code: curr.account_code, name: curr.account_name, total: 0 };
        }
        acc[curr.account_code].total += (curr.credit - curr.debit);
        return acc;
      }, {}));

      const expenseGrouped = Object.values(expense.reduce((acc: any, curr: any) => {
        if (!acc[curr.account_code]) {
          acc[curr.account_code] = { code: curr.account_code, name: curr.account_name, total: 0 };
        }
        acc[curr.account_code].total += (curr.debit - curr.credit);
        return acc;
      }, {}));

      return { revenue: revenueGrouped, expense: expenseGrouped };
    }
  });

  const totalRevenue = data?.revenue.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
  const totalExpense = data?.expense.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
  const netProfit = totalRevenue - totalExpense;

  // --- FUNGSI EXPORT PDF ---
  const handleDownloadPDF = () => {
    const element = document.getElementById('report-content');
    
    if (!element) {
      toast.error('Gagal membuat PDF: Elemen laporan tidak ditemukan.');
      return;
    }

    // FIXED: Menambahkan ': any' agar TypeScript tidak rewel soal tipe 'jpeg'
    const opt: any = {
      margin:       10, 
      filename:     `Laba_Rugi_${year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  // --- FUNGSI EXPORT EXCEL ---
  const handleDownloadExcel = () => {
    let csv = `LAPORAN LABA RUGI TAHUN ${year}\n\n`;
    
    csv += "PENDAPATAN\n";
    csv += "Kode Akun,Nama Akun,Jumlah\n";
    data?.revenue.forEach((item: any) => {
      csv += `${item.code},"${item.name}",${item.total}\n`;
    });
    csv += `TOTAL PENDAPATAN,,${totalRevenue}\n\n`;

    csv += "BEBAN & BIAYA\n";
    csv += "Kode Akun,Nama Akun,Jumlah\n";
    data?.expense.forEach((item: any) => {
      csv += `${item.code},"${item.name}",${item.total}\n`;
    });
    csv += `TOTAL BEBAN,,${totalExpense}\n\n`;

    csv += `LABA BERSIH,,${netProfit}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laba_Rugi_${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h1>
          <p className="text-gray-500 text-sm">Periode Tahun {year}</p>
        </div>

        <div className="flex gap-2">
           <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))} 
            className="border rounded-lg p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>

          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow text-sm font-medium">
            <FileDown size={18} /> PDF
          </button>
          
          <button onClick={handleDownloadExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow text-sm font-medium">
            <FileSpreadsheet size={18} /> Excel
          </button>
        </div>
      </div>

      {/* REPORT CONTENT */}
      <div id="report-content" className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
        {/* KOP LAPORAN */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest">Mining Support & General Supply</h2>
          <h3 className="text-lg font-semibold text-gray-600">LAPORAN LABA RUGI (INCOME STATEMENT)</h3>
          <p className="text-sm text-gray-500 mt-1">Periode Berakhir 31 Desember {year}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Menghitung Data...</div>
        ) : (
          <div className="space-y-8">
            
            {/* REVENUE */}
            <div>
              <h4 className="font-bold text-blue-800 mb-3 border-b border-blue-100 pb-1 flex items-center gap-2">
                PENDAPATAN USAHA
              </h4>
              <table className="w-full text-sm">
                <tbody>
                  {data?.revenue.length === 0 ? (
                     <tr><td className="text-gray-400 italic py-2">Belum ada pendapatan</td></tr>
                  ) : (
                    data?.revenue.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-600 w-20">{item.code}</td>
                        <td className="py-2 text-gray-800">{item.name}</td>
                        <td className="py-2 text-right font-medium text-gray-700">{item.total.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={2} className="py-3 font-bold text-gray-800 pl-4">Total Pendapatan</td>
                    <td className="py-3 text-right font-bold text-blue-700 text-base">{totalRevenue.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* EXPENSE */}
            <div>
              <h4 className="font-bold text-red-800 mb-3 border-b border-red-100 pb-1 flex items-center gap-2">
                BEBAN OPERASIONAL
              </h4>
              <table className="w-full text-sm">
                <tbody>
                  {data?.expense.length === 0 ? (
                     <tr><td className="text-gray-400 italic py-2">Belum ada beban</td></tr>
                  ) : (
                    data?.expense.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 text-gray-600 w-20">{item.code}</td>
                        <td className="py-2 text-gray-800">{item.name}</td>
                        <td className="py-2 text-right font-medium text-gray-700">{item.total.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-300">
                    <td colSpan={2} className="py-3 font-bold text-gray-800 pl-4">Total Beban</td>
                    <td className="py-3 text-right font-bold text-red-700 text-base">({totalExpense.toLocaleString()})</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* NET PROFIT */}
            <div className="mt-8 pt-4 border-t-2 border-gray-800 flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <div>
                <h4 className="text-lg font-bold text-gray-900">LABA (RUGI) BERSIH</h4>
                <p className="text-xs text-gray-500">Net Profit / Loss</p>
              </div>
              <div className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {netProfit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </div>
            </div>

            {/* TTD */}
            <div className="mt-16 grid grid-cols-3 gap-8 text-center text-xs text-gray-600 pt-10">
               <div>
                  <p>Dibuat Oleh,</p>
                  <div className="h-20 border-b border-gray-300 mb-2"></div>
                  <p className="font-bold">Admin Keuangan</p>
               </div>
               <div>
                  <p>Diperiksa Oleh,</p>
                  <div className="h-20 border-b border-gray-300 mb-2"></div>
                  <p className="font-bold">Manager Akuntansi</p>
               </div>
               <div>
                  <p>Disetujui Oleh,</p>
                  <div className="h-20 border-b border-gray-300 mb-2"></div>
                  <p className="font-bold">Direktur Utama</p>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}