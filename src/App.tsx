import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import TransactionForm from './pages/TransactionForm';
import TransactionList from './pages/TransactionList';
import ProfitLossReport from './pages/ProfitLossReport';
import MasterAccounts from './pages/MasterAccounts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return session ? <Outlet /> : <Navigate to="/portal-staff" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          
          <Routes>
            {/* 1. ROUTE PUBLIK (Bisa diakses siapa saja) */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/portal-staff" element={<Login />} />
            
            {/* 2. ROUTE TERPROTEKSI (Admin Panel) */}
            <Route element={<ProtectedRoute />}>
              {/* MainLayout membungkus semua halaman admin */}
              <Route element={<MainLayout />}>
                
                {/* Halaman Dashboard Utama */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Halaman Transaksi */}
                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/transactions/new" element={<TransactionForm />} />
                <Route path="/transactions/:id/edit" element={<TransactionForm />} />
                
                {/* Halaman Laporan */}
                <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
                
                {/* Halaman Master Data */}
                <Route path="/master/accounts" element={<MasterAccounts />} />

                {/* Halaman Pengaturan */}
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Redirect jika user nyasar ke halaman yang tidak ada */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;