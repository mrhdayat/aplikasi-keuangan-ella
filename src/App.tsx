import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner'; // Import ini wajib dipakai di bawah

import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import TransactionForm from './pages/TransactionForm';
import TransactionList from './pages/TransactionList';
import ProfitLossReport from './pages/ProfitLossReport';
import MasterAccounts from './pages/MasterAccounts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  return session ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {/* FIXED: Toaster dipasang di sini agar tidak dianggap unused */}
          <Toaster position="top-right" richColors closeButton />
          
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
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