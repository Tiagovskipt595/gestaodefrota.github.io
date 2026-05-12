import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../auth';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    department: '',
    licenseValidUntil: '',
    role: 'user' as const
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    // Basic validation
    if (!formData.email || !formData.password || !formData.name) {
      setMessage('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    // Phone validation: if provided, must be exactly 9 digits
    if (formData.phone) {
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length !== 9) {
        setMessage('O telefone deve ter exatamente 9 dígitos.');
        setLoading(false);
        return;
      }
    }

    // License validity validation: if provided, must be greater than today
    if (formData.licenseValidUntil) {
      const today = new Date().toISOString().split('T')[0];
      if (formData.licenseValidUntil <= today) {
        setMessage('A data de validade da carta deve ser maior que a data atual.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await register(formData);
      setMessage('Registo criado com sucesso! Redirecionando para o painel...');
      // Auto-login after registration and redirect to dashboard
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Erro desconhecido ao criar conta.';
      setMessage(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">
          Registar Nova Conta
        </h2>
        <p className="mb-6 text-sm text-slate-600">
          Preencha os dados abaixo para criar sua conta
        </p>

        {message && (
          <p className={`mb-4 text-sm ${message.includes('sucesso') ? 'text-emerald-600' : 'text-rose-600'}`}>
            {message}
          </p>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome completo *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Telefone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Departamento</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Carta válida até</label>
            <input
              type="date"
              value={formData.licenseValidUntil || ''}
              onChange={(e) => setFormData({ ...formData, licenseValidUntil: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div style={{ display: 'none' }}>
            <label className="block text-sm font-medium text-slate-700">Perfil</label>
            <select
              value={formData.role || 'user'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
              disabled
            >
              <option value="user">Utilizador</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">Apenas usuários podem se registrar através desta interface.</p>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
            <div className="flex items-end">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-0 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mt-0 flex items-center justify-center w-10 h-10 text-slate-500 hover:text-slate-700"
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Criando conta...' : 'Registar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <a href="/login" className="font-medium text-slate-900 hover:underline">
            Faça login aqui
          </a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;