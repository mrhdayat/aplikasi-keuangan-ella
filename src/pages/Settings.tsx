import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { useAuth } from '../features/auth/AuthContext';
// FIXED: Menghapus 'Save' dari import
import { Lock, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { session, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<any[]>([]);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 

  useEffect(() => {
    if (session?.user) setEmail(session.user.email || '');
    fetchRequests();
  }, [session]);

  const fetchRequests = async () => {
    const { data } = await supabase.from('change_requests').select('*').eq('status', 'PENDING');
    if (data) setRequestStatus(data);
  };

  const handleUpdateRequest = async (type: 'CHANGE_EMAIL' | 'RESET_PASSWORD') => {
    setLoading(true);
    
    if (role === 'VERIFICATOR') {
       if (type === 'CHANGE_EMAIL') {
          const { error } = await supabase.auth.updateUser({ email });
          if (error) toast.error(error.message);
          else toast.success('Email berhasil diupdate langsung (Privilege Verificator)');
       } else {
          const { error } = await supabase.auth.updateUser({ password });
          if (error) toast.error(error.message);
          else toast.success('Password berhasil diupdate langsung');
       }
       setLoading(false);
       return;
    }

    const payload = {
      user_id: session?.user.id,
      request_type: type,
      new_value: type === 'CHANGE_EMAIL' ? email : 'REQUEST_RESET',
      status: 'PENDING'
    };

    const { error } = await supabase.from('change_requests').insert(payload);
    
    if (error) {
      toast.error('Gagal mengajukan permintaan', { description: error.message });
    } else {
      toast.success('Permintaan Dikirim!', {
        description: 'Menunggu persetujuan dari Verifikator/Admin Utama.',
      });
      setPassword(''); 
      fetchRequests();
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan & Keamanan</h1>
        <p className="text-gray-500 text-sm">Update data sensitif memerlukan persetujuan Verifikator.</p>
      </div>

      {requestStatus.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center gap-2 text-yellow-700 font-bold mb-1">
            <AlertTriangle size={18} />
            <p>Permintaan Pending</p>
          </div>
          <p className="text-sm text-yellow-600">
            Anda memiliki {requestStatus.length} permintaan perubahan data yang sedang menunggu persetujuan Verifikator.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600"><Mail size={20} /></div>
            <h3 className="font-bold text-gray-700">Email Login</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email Baru</label>
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button 
              onClick={() => handleUpdateRequest('CHANGE_EMAIL')}
              disabled={loading || email === session?.user.email}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {role === 'VERIFICATOR' ? 'Update Email Sekarang' : 'Ajukan Perubahan Email'}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="bg-red-100 p-2 rounded-full text-red-600"><Lock size={20} /></div>
            <h3 className="font-bold text-gray-700">Ganti Password</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password Baru</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="********"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              onClick={() => handleUpdateRequest('RESET_PASSWORD')}
              disabled={loading || !password}
              className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-black transition disabled:opacity-50"
            >
              {role === 'VERIFICATOR' ? 'Update Password Sekarang' : 'Ajukan Ganti Password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}