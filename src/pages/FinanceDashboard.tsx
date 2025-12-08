import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, PlusCircle, FileText, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function FinanceDashboard() {
  const year = new Date().getFullYear();

  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const { data } = await supabase.from('view_financial_report')
        .select('*').eq('year', year);
      return data || [];
    }
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStats = stats?.filter(s => s.month === month) || [];
    const income = monthStats.filter(s => s.account_type === 'REVENUE').reduce((a, b) => a + (b.credit - b.debit), 0);
    const expense = monthStats.filter(s => s.account_type === 'EXPENSE').reduce((a, b) => a + (b.debit - b.credit), 0);
    return { name: `Bulan ${month}`, Pendapatan: income, Beban: expense };
  });

  const expenseByCategory = stats?.filter(s => s.account_type === 'EXPENSE').reduce((acc: any, curr) => {
    const cat = curr.account_category;
    acc[cat] = (acc[cat] || 0) + (curr.debit - curr.credit);
    return acc;
  }, {});
  
  const pieData = Object.keys(expenseByCategory || {}).map(key => ({
    name: key.replace('_', ' '), value: expenseByCategory[key]
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Keuangan</h2>
        <p className="text-gray-500">Overview kinerja keuangan tahun {year}.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/transactions/new" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl shadow-lg flex flex-col items-center gap-2 transition transform hover:-translate-y-1">
          <PlusCircle size={32} />
          <span className="font-semibold text-sm">Input Transaksi</span>
        </Link>
        <Link to="/reports/profit-loss" className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl shadow-lg flex flex-col items-center gap-2 transition transform hover:-translate-y-1">
          <FileText size={32} />
          <span className="font-semibold text-sm">Laporan Laba Rugi</span>
        </Link>
        <Link to="/transactions" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl shadow-lg flex flex-col items-center gap-2 transition transform hover:-translate-y-1">
          <Wallet size={32} />
          <span className="font-semibold text-sm">Cek Saldo</span>
        </Link>
        <Link to="/settings" className="bg-slate-700 hover:bg-slate-800 text-white p-4 rounded-xl shadow-lg flex flex-col items-center gap-2 transition transform hover:-translate-y-1">
          <Send size={32} />
          <span className="font-semibold text-sm">Request Admin</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" /> Arus Kas Bulanan
          </h3>
          {/* FIX: Tambah min-h-[300px] */}
          <div className="h-80 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                <Bar dataKey="Pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Beban" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingDown size={20} className="text-orange-500" /> Komposisi Beban
          </h3>
          {/* FIX: Tambah min-h-[250px] */}
          <div className="h-64 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name}
                </span>
                <span className="font-mono">{(entry.value / 1000000).toFixed(1)} Jt</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}