import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export default function ProfitLossReport() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['profitLoss', year],
    queryFn: async () => {
      // Fetch hanya akun Revenue dan Expense dari View
      const { data, error } = await supabase
        .from('view_financial_report')
        .select('*')
        .eq('year', year)
        .in('account_type', ['REVENUE', 'EXPENSE']);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Loading Laporan...</div>;

  // Grouping Data by Account Category & Name
  const groupedData = data?.reduce((acc: any, curr) => {
    const type = curr.account_type; // REVENUE or EXPENSE
    if (!acc[type]) acc[type] = {};
    if (!acc[type][curr.account_name]) acc[type][curr.account_name] = 0;
    
    // Revenue: Credit adds, Debit subtracts. Expense: Debit adds, Credit subtracts.
    const amount = type === 'REVENUE' 
      ? (curr.credit - curr.debit) 
      : (curr.debit - curr.credit);
      
    acc[type][curr.account_name] += amount;
    return acc;
  }, { REVENUE: {}, EXPENSE: {} });

  const totalRevenue = Object.values(groupedData.REVENUE).reduce((a: any, b: any) => a + b, 0) as number;
  const totalExpense = Object.values(groupedData.EXPENSE).reduce((a: any, b: any) => a + b, 0) as number;
  const netProfit = totalRevenue - totalExpense;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white shadow min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Laporan Laba Rugi</h1>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border p-2 rounded">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* PENDAPATAN */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-blue-800 border-b-2 border-blue-800 mb-2">PENDAPATAN</h3>
        <table className="w-full">
          <tbody>
            {Object.entries(groupedData.REVENUE).map(([name, val]: any) => (
              <tr key={name} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{name}</td>
                <td className="py-2 text-right">{val.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="py-2 pl-2">Total Pendapatan</td>
              <td className="py-2 text-right">{totalRevenue.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* BEBAN */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-red-800 border-b-2 border-red-800 mb-2">BEBAN & BIAYA</h3>
        <table className="w-full">
          <tbody>
            {Object.entries(groupedData.EXPENSE).map(([name, val]: any) => (
              <tr key={name} className="border-b border-gray-100">
                <td className="py-2 text-gray-700">{name}</td>
                <td className="py-2 text-right">{val.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="py-2 pl-2">Total Beban</td>
              <td className="py-2 text-right">{totalExpense.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* NET PROFIT */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded text-center">
        <h2 className="text-xl font-medium text-gray-600">Laba / (Rugi) Bersih</h2>
        <div className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          Rp {netProfit.toLocaleString()}
        </div>
      </div>
    </div>
  );
}