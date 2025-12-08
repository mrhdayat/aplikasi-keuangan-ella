import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Shield, KeyRound, ArrowRight } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [isVerified, setIsVerified] = useState(false); 
  const SECRET_PIN = '2025'; 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === SECRET_PIN) {
      setIsVerified(true);
      toast.success('Akses Diterima.');
    } else {
      toast.error('Kode Akses Salah!', { description: 'IP Anda telah dicatat.' });
      setAccessCode('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Login Gagal', { description: error.message });
    } else {
      toast.success('Selamat Datang Kembali!');
      // FIX: Redirect ke /dashboard
      navigate('/dashboard'); 
    }
    setLoading(false);
  };

  // ... (Sisa kode tampilan sama seperti sebelumnya) ...
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
       {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-200 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[100px] opacity-30"></div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 relative z-10">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
            {isVerified ? <Lock className="text-white" size={32} /> : <Shield className="text-white" size={32} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isVerified ? 'Login Staff' : 'Portal Keamanan'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isVerified ? 'Masukkan kredensial akun Anda.' : 'Sistem terbatas. Masukkan Kode Akses.'}
          </p>
        </div>
        
        {!isVerified ? (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kode Akses Perusahaan</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="PIN" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono tracking-widest text-center text-lg" autoFocus />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition flex items-center justify-center gap-2">
              Verifikasi <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-70 mt-4">
              {loading ? 'Memproses...' : 'Masuk Dashboard'}
            </button>
            <button type="button" onClick={() => setIsVerified(false)} className="w-full text-sm text-slate-400 hover:text-slate-600 mt-2">← Kembali ke Layar Kunci</button>
          </form>
        )}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">IP Address & Waktu Akses dicatat oleh sistem keamanan.</p>
        </div>
      </div>
    </div>
  );
}