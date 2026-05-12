import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../auth';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await forgotPassword(email);
      setMessage(response.message || 'Se o email existir, você receberá instruções para redefinir a senha');
      // Optionally clear email after sending
      setEmail('');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || err?.message || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Esqueci minha senha</h2>
        <p className="mb-6 text-slate-600">
          Digite seu e-mail abaixo para receber instruções de como redefinir sua senha.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">E-mail</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && <p className={loading ? 'text-slate-600' : 'text-sm text-rose-600'}>{message}</p>}
          <button
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar instruções'}
          </button>
        </form>
        <div className="mt-5 text-center text-sm text-slate-500">
          Lembrou da senha?{" "}
          <a href="/login" className="font-medium text-slate-900 hover:underline">
            Faça login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;