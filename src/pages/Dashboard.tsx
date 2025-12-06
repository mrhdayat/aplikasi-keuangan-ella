import { useAuth } from '../features/auth/AuthContext';
import FinanceDashboard from './FinanceDashboard';
import VerificatorDashboard from './VerificatorDashboard';

export default function Dashboard() {
  const { role } = useAuth();

  // Jika Role Verificator -> Tampilkan Dashboard Khusus
  if (role === 'VERIFICATOR') {
    return <VerificatorDashboard />;
  }

  // Default -> Dashboard Keuangan
  return <FinanceDashboard />;
}