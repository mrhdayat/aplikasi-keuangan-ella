import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, LogOut, Book, Settings, Scale, Building2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../features/auth/AuthContext';

export default function MainLayout() {
  const { session, role } = useAuth();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Input Jurnal', path: '/transactions/new', icon: PlusCircle },
    { name: 'Daftar Jurnal', path: '/transactions', icon: BookOpen },
    { name: 'Neraca Saldo', path: '/reports/trial-balance', icon: Scale }, // Baru
    { name: 'Laba Rugi', path: '/reports/profit-loss', icon: FileText },
    { name: 'Posisi Keuangan', path: '/reports/balance-sheet', icon: Building2 }, // Baru
    { name: 'Master Akun', path: '/master/accounts', icon: Book },
    { name: 'Pengaturan', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wide">FINANCE APP</h1>
          <p className="text-xs text-slate-400 mt-1">Mining Support & Supply</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:bg-red-900/50 hover:text-red-400 rounded-lg transition">
            <LogOut size={20} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-y-auto">
        <header className="bg-white shadow-sm sticky top-0 z-20 px-8 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">Sistem Keuangan</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session?.user?.user_metadata?.name || session?.user?.email}</p>
              <p className="text-xs text-gray-500 uppercase">{role || 'User'}</p>
            </div>
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
              {session?.user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}