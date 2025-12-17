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
import TrialBalance from './pages/TrialBalance'; // Baru
import BalanceSheetReport from './pages/BalanceSheetReport'; // Baru
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/portal-staff" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/transactions" element={<TransactionList />} />
                <Route path="/transactions/new" element={<TransactionForm />} />
                <Route path="/transactions/:id/edit" element={<TransactionForm />} />
                
                <Route path="/reports/profit-loss" element={<ProfitLossReport />} />
                <Route path="/reports/balance-sheet" element={<BalanceSheetReport />} /> {/* Baru */}
                <Route path="/reports/trial-balance" element={<TrialBalance />} /> {/* Baru */}
                
                <Route path="/master/accounts" element={<MasterAccounts />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;