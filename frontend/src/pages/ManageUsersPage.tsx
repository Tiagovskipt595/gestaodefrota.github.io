import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getUser } from '../auth';
import { User } from '../types';

// Helper function to get mock users from localStorage when API is not available
function getMockUsers(): User[] {
  try {
    const mockUsers = localStorage.getItem('mock-users');
    const users = mockUsers ? JSON.parse(mockUsers) : [];

    // Convert to User format (including extended fields)
    return users.map((user: any) => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      department: user.department || '',
      phone: user.phone || '',
      licenseValidUntil: user.licenseValidUntil || ''
    }));
  } catch (e) {
    console.warn('Failed to parse mock users from localStorage:', e);
    return [];
  }
}

// Helper function to save mock users to localStorage
function saveMockUsers(users: User[]) {
  try {
    // Store full user data
    const fullUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      licenseValidUntil: user.licenseValidUntil || '',
      createdAt: user.createdAt || new Date().toISOString()
    }));
    localStorage.setItem('mock-users', JSON.stringify(fullUsers));
  } catch (e) {
    console.error('Failed to save mock users to localStorage:', e);
  }
}

const ManageUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<User> & {
    password: string;
    department: string;
    phone: string;
    licenseValidUntil: string;
  }>({
    role: 'user',
    password: '',
    department: '',
    phone: '',
    licenseValidUntil: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const currentUser = getUser();

  // Redirect to dashboard if user is not admin or manager
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    navigate('/');
    return null;
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/drivers');
      setUsers(response.data);
    } catch (err) {
      // Fall back to mock users when API is not available
      console.warn('API drivers endpoint not available, using mock data:', err.message);
      const mockUsers = getMockUsers();
      setUsers(mockUsers);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      setMessage('Preencha os campos obrigatórios.');
      return;
    }

    if (!editingId && !formData.password) {
      setMessage('Password é obrigatório para novos utilizadores.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/drivers/${editingId}`, formData);
        setMessage('Utilizador atualizado com sucesso.');
      } else {
        await api.post('/drivers', formData);
        setMessage('Utilizador criado com sucesso.');
      }
      setFormData({
        role: 'user',
        password: '',
        department: '',
        phone: '',
        licenseValidUntil: ''
      });
      setEditingId(null);
      setShowPassword(false);
      loadUsers();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao processar utilizador.');
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      department: user.department || '',
      phone: user.phone || '',
      licenseValidUntil: user.licenseValidUntil || ''
    });
    setEditingId(user.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja remover este utilizador?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      setMessage('Utilizador removido com sucesso.');
      loadUsers();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao remover utilizador.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Gerir Utilizadores</h2>
        <p className="mt-2 text-slate-600">Crie admins, gestores de frota e utilizadores normais.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar utilizador' : 'Novo utilizador'}</h3>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nome completo *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              placeholder="João Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              placeholder="joao@empresa.com"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Departamento</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Comercial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Telefone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="999-000-111"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Perfil *</label>
            <select
              value={formData.role || 'user'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              required
            >
              <option value="user">Utilizador</option>
              <option value="manager">Gestor de frota</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Carta válida até</label>
            <input
              type="date"
              value={formData.licenseValidUntil || ''}
              onChange={(e) => setFormData({ ...formData, licenseValidUntil: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          {!editingId && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.125-3.574-8.875-8h1.125C6.375 10.82 9.875 12 12 12s5.625-1.18 6.375-3h1.125c-.75 4.426-4.397 8-8.875 8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 5.175a10.05 10.05 0 00-1.875 8.65M15 7.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.125-3.574-8.875-8h1.125M15 7.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {editingId && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Nova password (deixe em branco para manter)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center text-slate-500 hover:text-slate-700"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.125-3.574-8.875-8h1.125C6.375 10.82 9.875 12 12 12s5.625-1.18 6.375-3h1.125c-.75 4.426-4.397 8-8.875 8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 5.175a10.05 10.05 0 00-1.875 8.65M15 7.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.125-3.574-8.875-8h1.125M15 7.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {message && <p className="text-sm text-slate-600">{message}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              {editingId ? 'Atualizar' : 'Criar utilizador'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    role: 'user',
                    password: '',
                    department: '',
                    phone: '',
                    licenseValidUntil: ''
                  });
                  setEditingId(null);
                  setShowPassword(false);
                }}
                className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Utilizadores</h3>
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-slate-900 text-white'
                          : user.role === 'manager'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gestor' : 'Utilizador'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-300"
                  >
                    Editar
                  </button>
                  {user.id !== currentUser.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="flex-1 rounded-lg bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPage;