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
import LandingPage from './pages/LandingPage'; // IMPORT LANDING PAGE
import { AuthProvider, useAuth } from './features/auth/AuthContext';

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  // UPDATE: Jika belum login, lempar ke URL Login Rahasia (bukan /login lagi)
  return session ? <Outlet /> : <Navigate to="/portal-staff" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          
          <Routes>
            {/* ROUTE PUBLIK */}
            <Route path="/" element={<LandingPage />} />
            
            {/* ROUTE LOGIN RAHASIA (Ganti 'portal-staff' dengan kata acak lain jika mau lebih aman) */}
            <Route path="/portal-staff" element={<Login />} />
            
            {/* ROUTE TERPROTEKSI (DASHBOARD) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MainLayout />}>
                 {/* Redirect /dashboard langsung ke index dashboard */}
                 <Route index element={<Dashboard />} />
                
                <Route path="transactions">
                  <Route index element={<TransactionList />} />
                  <Route path="new" element={<TransactionForm />} />
                  <Route path=":id/edit" element={<TransactionForm />} />
                </Route>
                
                <Route path="reports">
                  <Route path="profit-loss" element={<ProfitLossReport />} />
                </Route>
                
                <Route path="master">
                  <Route path="accounts" element={<MasterAccounts />} />
                </Route>

                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;