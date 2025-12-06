import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Fungsi login bawaan Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Login Gagal: ' + error.message);
    } else {
      // Jika sukses, redirect ke Dashboard
      navigate('/'); 
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Login Keuangan</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@keuangan.com"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-2 px-4 rounded hover:bg-blue-800 transition disabled:opacity-50 font-semibold"
          >
            {loading ? 'Sedang Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          <p>Belum punya akun? Hubungi Administrator IT.</p>
        </div>
      </div>
    </div>
  );
}