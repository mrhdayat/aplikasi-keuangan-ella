import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function GeneralLedger() {
  const { accountId } = useParams();
  const [searchParams] = useSearchParams();
  const yearParam = searchParams.get('year');
  const [year, setYear] = useState(yearParam ? Number(yearParam) : new Date().getFullYear());
  const navigate = useNavigate();

  // 1. Ambil Info Akun
  const { data: accountInfo } = useQuery({
    queryKey: ['account_info', accountId],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*').eq('id', accountId).single();
      return data;
    }
  });

  // 2. Ambil Transaksi (Detail Jurnal)
  const { data: entries, isLoading } = useQuery({
    queryKey: ['ledger_entries', accountId, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          debit, credit,
          transactions (
            date, voucher_number, description, status, year
          )
        `)
        .eq('account_id', accountId)
        .filter('transactions.status', 'eq', 'POSTED') // Hanya yang sudah posting
        // Filter Tahun: Sesuaikan dengan tahun laporan yang sedang dilihat
        .filter('transactions.year', 'eq', year) 
        .order('transactions(date)', { ascending: true });

      if (error) throw error;
      
      return data.map((item: any) => ({
        date: item.transactions.date,
        voucher: item.transactions.voucher_number,
        desc: item.transactions.description,
        debit: item.debit,
        credit: item.credit
      }));
    }
  });

  let runningBalance = 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in">
      {/* Header & Navigasi */}
      <div className="flex items-center gap-4 no-print bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Buku Besar: <span className="text-blue-600">{accountInfo?.code} - {accountInfo?.name}</span></h1>
          <p className="text-sm text-gray-500">Detail pergerakan transaksi Tahun {year}</p>
        </div>
        <div className="ml-auto">
           <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg p-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">No. Bukti</th>
              <th className="px-6 py-4">Uraian</th>
              <th className="px-6 py-4 text-right">Debit</th>
              <th className="px-6 py-4 text-right">Kredit</th>
              <th className="px-6 py-4 text-right bg-gray-100">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">Memuat data transaksi...</td></tr> :
            entries?.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Tidak ada transaksi di tahun ini.</td></tr> :
            entries?.map((row: any, idx: number) => {
              // Hitung Saldo Berjalan (Running Balance)
              const movement = row.debit - row.credit;
              // Jika akun Liability/Equity/Revenue, saldo normal kredit (dibalik)
              const isCreditNormal = ['LIABILITY', 'EQUITY', 'REVENUE'].includes(accountInfo?.type);
              
              if (isCreditNormal) {
                 runningBalance += (row.credit - row.debit);
              } else {
                 runningBalance += (row.debit - row.credit);
              }

              return (
                <tr key={idx} className="hover:bg-blue-50 transition">
                  <td className="px-6 py-3 whitespace-nowrap text-gray-600">{row.date}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs font-mono">{row.voucher || '-'}</td>
                  <td className="px-6 py-3 text-gray-800">{row.desc}</td>
                  <td className="px-6 py-3 text-right font-mono text-gray-600">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                  <td className="px-6 py-3 text-right font-mono text-gray-600">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                  <td className="px-6 py-3 text-right font-bold font-mono text-gray-800 bg-gray-50 border-l border-gray-100">
                    {runningBalance.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}