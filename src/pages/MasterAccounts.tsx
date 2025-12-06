import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Plus, Pencil, Trash2, Save, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner'; // Import Toast

// Konfigurasi Pagination
const ITEMS_PER_PAGE = 10;

export default function MasterAccounts() {
  const queryClient = useQueryClient();
  
  // State UI
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState(''); // State pencarian
  const [page, setPage] = useState(1);      // State halaman

  // Form State
  const [formData, setFormData] = useState({
    code: '', name: '', type: 'EXPENSE', category: 'OPERASIONAL'
  });

  // --- 1. Fetch Data dengan Search & Pagination ---
  const { data, isLoading } = useQuery({
    queryKey: ['accounts_master', page, search], // Refetch saat page/search berubah
    queryFn: async () => {
      // Hitung Range untuk Pagination
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('accounts')
        .select('*', { count: 'exact' }); // Minta total data juga

      // Logic Search (Cari berdasarkan Nama ATAU Kode)
      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }

      // Logic Pagination & Sorting
      const { data, error, count } = await query
        .order('code', { ascending: true })
        .range(from, to);

      if (error) throw error;
      return { data, total: count || 0 };
    },
    // KeepPreviousData membuat transisi halaman lebih mulus
    placeholderData: (previousData) => previousData, 
  });

  const accounts = data?.data || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // --- 2. Mutations dengan Toast ---
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const { error } = await supabase.from('accounts').update(data).eq('id', isEditing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('accounts').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_master'] });
      resetForm();
      toast.success(isEditing ? 'Akun berhasil diperbarui!' : 'Akun baru berhasil dibuat!');
    },
    onError: (err: any) => toast.error(`Gagal menyimpan: ${err.message}`)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts_master'] });
      toast.success('Akun berhasil dihapus');
    },
    onError: (err: any) => toast.error(`Gagal menghapus: ${err.message}`)
  });

  // Helper Functions
  const resetForm = () => {
    setIsEditing(null);
    setIsCreating(false);
    setFormData({ code: '', name: '', type: 'EXPENSE', category: 'OPERASIONAL' });
  };

  const handleEdit = (acc: any) => {
    setIsEditing(acc.id);
    setIsCreating(true);
    setFormData({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      category: acc.category
    });
    // Scroll ke atas form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    toast('Hapus akun ini?', {
      action: {
        label: 'Ya, Hapus',
        onClick: () => deleteMutation.mutate(id),
      },
      cancel: { 
        label: 'Batal',
        onClick: () => {}, // <--- TAMBAHKAN INI (Fungsi kosong untuk memuaskan TypeScript)
      } 
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset ke halaman 1 saat searching
  };

  return (
    <div className="space-y-6">
      {/* Header & Tools */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Akun (COA)</h1>
          <p className="text-gray-500 text-sm">Kelola daftar akun keuangan perusahaan.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* Live Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari akun..." 
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow transition"
            >
              <Plus size={18} /> <span className="hidden md:inline">Tambah Akun</span>
            </button>
          )}
        </div>
      </div>

      {/* Form Input (Muncul saat Create/Edit) */}
      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">{isEditing ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Kode Akun</label>
              <input 
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none" 
                placeholder="Contoh: 5101"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Akun</label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none" 
                placeholder="Contoh: Biaya Listrik"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Tipe</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              >
                <option value="ASSET">Harta (Asset)</option>
                <option value="LIABILITY">Hutang (Liability)</option>
                <option value="EQUITY">Modal (Equity)</option>
                <option value="REVENUE">Pendapatan (Revenue)</option>
                <option value="EXPENSE">Beban (Expense)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Kategori</label>
              <select 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-200 outline-none bg-white"
              >
                <option value="OPERASIONAL">Operasional</option>
                <option value="PROYEK_TAMBANG">Proyek Tambang</option>
                <option value="GENERAL_SUPPLY">General Supply</option>
                <option value="SUB_KONTRAKTOR">Sub Kontraktor</option>
                <option value="LAIN_LAIN">Lain-lain</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 border-t pt-4">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Batal</button>
            <button 
              onClick={() => mutation.mutate(formData)} 
              disabled={mutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow transition disabled:opacity-50"
            >
              {mutation.isPending ? 'Menyimpan...' : <><Save size={18} /> Simpan Data</>}
            </button>
          </div>
        </div>
      )}

      {/* Tabel Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b">
            <tr>
              <th className="px-6 py-4">Kode</th>
              <th className="px-6 py-4">Nama Akun</th>
              <th className="px-6 py-4">Tipe</th>
              <th className="px-6 py-4">Kategori</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Sedang memuat data...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Tidak ada data ditemukan.</td></tr>
            ) : (
              accounts.map((acc: any) => (
                <tr key={acc.id} className="hover:bg-blue-50/50 transition duration-150">
                  <td className="px-6 py-3 font-mono font-medium text-blue-800">{acc.code}</td>
                  <td className="px-6 py-3 font-medium text-gray-800">{acc.name}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      acc.type === 'REVENUE' ? 'bg-green-100 text-green-700' :
                      acc.type === 'EXPENSE' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {acc.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{acc.category.replace('_', ' ')}</td>
                  <td className="px-6 py-3 flex justify-center gap-2">
                    <button 
                      onClick={() => handleEdit(acc)} 
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)} 
                      className="p-2 text-red-500 hover:bg-red-100 rounded-full transition"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Footer Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Menampilkan {accounts.length} dari <b>{totalItems}</b> data
          </span>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium px-2">
              Halaman {page} dari {totalPages || 1}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 border rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}