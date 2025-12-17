import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [year, setYear] = useState(new Date().getFullYear());

  // 1. Fetch Data Pakai RPC 'p_year'
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard_stats', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_account_balances', { p_year: year });
        
      if (error) throw error;
      return data || [];
    }
  });

  // 2. Hitung Angka-Angka Penting
  const totalRevenue = data?.filter((d: any) => d.type === 'REVENUE').reduce((a: any, b: any) => a + b.balance, 0) || 0;
  const totalExpense = data?.filter((d: any) => d.type === 'EXPENSE').reduce((a: any, b: any) => a + b.balance, 0) || 0;
  const netProfit = totalRevenue - totalExpense;
  
  const totalAsset = data?.filter((d: any) => d.type === 'ASSET').reduce((a: any, b: any) => a + b.balance, 0) || 0;
  const totalLiability = data?.filter((d: any) => d.type === 'LIABILITY').reduce((a: any, b: any) => a + b.balance, 0) || 0;
  const totalEquity = data?.filter((d: any) => d.type === 'EQUITY').reduce((a: any, b: any) => a + b.balance, 0) || 0;

  // 3. Siapkan Data untuk Grafik
  const barData = [
    { name: 'Pendapatan', amount: totalRevenue },
    { name: 'Beban', amount: totalExpense },
  ];

  // Data Pie Chart (Top 5 Beban Terbesar)
  const expenseData = data
    ?.filter((d: any) => d.type === 'EXPENSE' && d.balance > 0)
    .sort((a: any, b: any) => b.balance - a.balance)
    .slice(0, 5)
    .map((d: any) => ({ name: d.name, value: d.balance })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat Dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Keuangan</h1>
          <p className="text-gray-500 text-sm">Ringkasan performa tahun {year}</p>
        </div>
        <select 
          value={year} 
          onChange={(e) => setYear(Number(e.target.value))} 
          className="border rounded-lg p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
      </div>

      {/* Kartu Ringkasan (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-100 text-sm font-medium">Total Aset</span>
            <Wallet size={20} className="text-blue-200" />
          </div>
          <p className="text-2xl font-bold font-mono">{totalAsset.toLocaleString()}</p>
        </div>

        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-emerald-100 text-sm font-medium">Laba Bersih</span>
            <TrendingUp size={20} className="text-emerald-200" />
          </div>
          <p className="text-2xl font-bold font-mono">{netProfit.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm font-medium">Total Utang</span>
            <TrendingDown size={20} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 font-mono">{totalLiability.toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-500 text-sm font-medium">Total Modal</span>
            <DollarSign size={20} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 font-mono">{totalEquity.toLocaleString()}</p>
        </div>
      </div>

      {/* Area Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grafik 1: Bar Chart (Pendapatan vs Beban) */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-6 border-b pb-2">Performa Usaha (Revenue vs Expense)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(val: number) => val.toLocaleString('id-ID')} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60}>
                  {/* FIXED: Menggunakan '_: any' dan 'index: number' */}
                  {barData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik 2: Pie Chart (Komposisi Beban) */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-6 border-b pb-2">Komposisi Beban (Top 5)</h3>
          <div className="h-72 w-full">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {/* FIXED: Menggunakan '_: any' dan 'index: number' */}
                    {expenseData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => val.toLocaleString('id-ID')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                Belum ada data beban.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}