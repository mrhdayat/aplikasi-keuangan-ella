import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
// FIXED: Menghapus useMutation, XCircle, TrendingDown, PieIcon, CheckCircle (karena tidak dipakai)
import { ShieldAlert, UserCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function VerificatorDashboard() {
  const queryClient = useQueryClient();
  const year = new Date().getFullYear();

  const { data: requests, isLoading: loadingReq } = useQuery({
    queryKey: ['change_requests'],
    queryFn: async () => {
      const { data } = await supabase.from('change_requests')
        .select('*, profiles:user_id(name, email)')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats_verificator'],
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

  const handleApprove = async (req: any) => {
    try {
      if (req.request_type === 'CHANGE_EMAIL') {
        toast.info('Simulasi: Email user diupdate.'); 
      } else {
        toast.info('Simulasi: Password reset dikirim.');
      }
      await supabase.from('change_requests').update({ status: 'APPROVED' }).eq('id', req.id);
      toast.success('Permintaan disetujui');
      queryClient.invalidateQueries({ queryKey: ['change_requests'] });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReject = async (id: string) => {
    await supabase.from('change_requests').update({ status: 'REJECTED' }).eq('id', id);
    toast.success('Permintaan ditolak');
    queryClient.invalidateQueries({ queryKey: ['change_requests'] });
  };

  return (
    <div className="bg-slate-50 min-h-screen -m-8 p-8 space-y-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-900 rounded-xl text-white shadow-lg">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Panel Verifikator</h1>
            <p className="text-slate-500 text-sm">Persetujuan & Pengawasan Keuangan.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b bg-slate-100 flex justify-between items-center">
             <h3 className="font-bold text-slate-700">Daftar Permintaan Pending</h3>
             <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{requests?.length || 0} Menunggu</span>
          </div>
          
          {loadingReq ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : requests?.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center text-slate-400">
              <UserCheck size={40} className="mb-2 opacity-50"/>
              <p>Aman. Tidak ada permintaan pending.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests?.map((req: any) => (
                <div key={req.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${req.request_type === 'RESET_PASSWORD' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {req.request_type === 'RESET_PASSWORD' ? <ShieldAlert size={20}/> : <UserCheck size={20}/>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{req.profiles?.name}</p>
                      <p className="text-xs text-slate-500">
                        Request: <span className="font-medium text-slate-700">{req.request_type === 'CHANGE_EMAIL' ? 'Ganti Email' : 'Reset Password'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded hover:bg-red-50 hover:text-red-600 text-xs font-bold">Tolak</button>
                    <button onClick={() => handleApprove(req)} className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs font-bold">Setujui</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 mt-8 pt-8 border-t border-slate-200">
          <TrendingUp className="text-slate-400" size={24}/>
          <h2 className="text-xl font-bold text-slate-800">Monitoring Keuangan (Read Only)</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow border border-slate-200 opacity-90"> 
            <h3 className="font-bold text-slate-700 mb-4 text-sm">Arus Kas (Pendapatan vs Beban)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                  <Bar dataKey="Pendapatan" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Beban" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-slate-200 opacity-90">
            <h3 className="font-bold text-slate-700 mb-4 text-sm">Komposisi Beban</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {/* FIXED: Menggunakan underscore (_) agar 'entry' tidak dianggap unused */}
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-1">
              {pieData.slice(0, 3).map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {entry.name}
                  </span>
                  <span className="font-mono">{(entry.value / 1000000).toFixed(1)} Jt</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}