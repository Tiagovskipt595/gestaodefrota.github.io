import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, setUser } from '../auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await login({ email, password });
      setToken(response.token);
      setUser(response.user);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Falha no login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Entrar no sistema</h2>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="flex items-end">
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700" type="submit">
            Entrar
          </button>
          <div className="mt-5 text-center text-sm text-slate-500">
            Não tem uma conta?{" "}
            <a href="/register" className="font-medium text-slate-900 hover:underline">
              Registe-se aqui
            </a>
          </div>
        </form>
      </div
>
    </div>
  );
};

export default LoginPage;