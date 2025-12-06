import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, PieChart, Database } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-900 p-2 rounded-lg">
            <Database className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">MINING FINANCE</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Support & Supply System</p>
          </div>
        </div>
        <div>
          <Link 
            to="/portal-staff" // URL RAHASIA
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            Staff Portal
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="px-6 md:px-12 py-20 md:py-32 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
            Internal System v1.0
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            Kelola Keuangan <br/>
            <span className="text-blue-600">Proyek Tambang</span> <br/>
            Secara Real-time.
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
            Sistem terintegrasi untuk pencatatan jurnal harian, monitoring arus kas proyek, dan pelaporan laba rugi otomatis untuk Mining Support & General Supply.
          </p>
          <div className="flex gap-4 pt-4">
            <Link 
              to="/portal-staff" 
              className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center gap-2 transform hover:-translate-y-1"
            >
              Masuk ke Sistem <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Ilustrasi Visual (Simulasi Dashboard) */}
        <div className="relative">
          <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
          <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-slate-200">
            <div className="flex items-center gap-4 mb-6 border-b pb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                <PieChart size={48} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-20 bg-blue-50 rounded-lg"></div>
                <div className="h-20 bg-blue-50 rounded-lg"></div>
                <div className="h-20 bg-blue-50 rounded-lg"></div>
              </div>
            </div>
            {/* Badge Security */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Status Keamanan</p>
                <p className="font-bold text-slate-800">Terproteksi</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
        <p>&copy; 2025 Mining Support & General Supply. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-50">Authorized Personnel Only.</p>
      </footer>
    </div>
  );
}