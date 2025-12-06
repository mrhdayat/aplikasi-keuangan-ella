import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Plus, Pencil, Trash2, Save } from 'lucide-react';

export default function MasterProjects() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', client_name: '', status: 'BERJALAN', contract_value: 0
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects_master'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const { error } = await supabase.from('projects').update(data).eq('id', isEditing);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('projects').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects_master'] });
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects_master'] })
  });

  const resetForm = () => {
    setIsEditing(null);
    setIsCreating(false);
    setFormData({ name: '', client_name: '', status: 'BERJALAN', contract_value: 0 });
  };

  const handleEdit = (proj: any) => {
    setIsEditing(proj.id);
    setIsCreating(true);
    setFormData({
      name: proj.name,
      client_name: proj.client_name,
      status: proj.status,
      contract_value: proj.contract_value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Master Proyek</h1>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Tambah Proyek
          </button>
        )}
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-lg shadow border border-blue-100">
          <h3 className="font-bold text-gray-700 mb-4">{isEditing ? 'Edit Proyek' : 'Tambah Proyek Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600">Nama Proyek</label>
              <input 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border p-2 rounded" placeholder="Contoh: Proyek Hauling Batubara"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Nama Klien / Vendor</label>
              <input 
                value={formData.client_name} 
                onChange={e => setFormData({...formData, client_name: e.target.value})}
                className="w-full border p-2 rounded" placeholder="PT. ABC Mining"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Status</label>
              <select 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
                className="w-full border p-2 rounded"
              >
                <option value="BERJALAN">Berjalan</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIHENTIKAN">Dihentikan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Nilai Kontrak (Opsional)</label>
              <input 
                type="number"
                value={formData.contract_value} 
                onChange={e => setFormData({...formData, contract_value: Number(e.target.value)})}
                className="w-full border p-2 rounded"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
            <button onClick={() => mutation.mutate(formData)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
              <Save size={18} /> Simpan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-bold">
            <tr>
              <th className="px-6 py-3">Nama Proyek</th>
              <th className="px-6 py-3">Klien</th>
              <th className="px-6 py-3">Nilai Kontrak</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr> : projects?.map((proj) => (
              <tr key={proj.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{proj.name}</td>
                <td className="px-6 py-3 text-gray-500">{proj.client_name}</td>
                <td className="px-6 py-3">{proj.contract_value?.toLocaleString('id-ID')}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs ${proj.status === 'BERJALAN' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                    {proj.status}
                  </span>
                </td>
                <td className="px-6 py-3 flex justify-center gap-3">
                  <button onClick={() => handleEdit(proj)} className="text-blue-600 hover:text-blue-800"><Pencil size={16} /></button>
                  <button onClick={() => { if(confirm('Hapus proyek?')) deleteMutation.mutate(proj.id); }} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}