import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../auth';

const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    if (password !== confirmPassword) {
      setMessage('As senhas não coincidem');
      setLoading(false);
      return;
    }
    try {
      await resetPassword(token, password);
      setMessage('Senha redefinida com sucesso! Você pode agora fazer login.');
      // Clear fields
      setPassword('');
      setConfirmPassword('');
      // Optionally redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || err?.message || 'Token inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    navigate('/forgot-password', { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Redefinir senha</h2>
        <p className="mb-6 text-slate-600">
          Digite uma nova senha abaixo. Confirme-a para continuar.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nova senha</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirmar nova senha</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {message && <p className={loading ? 'text-slate-600' : 'text-sm text-rose-600'}>{message}</p>}
          <button
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>
        <div className="mt-5 text-center text-sm text-slate-500">
          <a href="/login" className="font-medium text-slate-900 hover:underline">
            Voltar para login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;