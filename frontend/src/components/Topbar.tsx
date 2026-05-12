import { logout } from '../auth';

const Topbar = () => {
  return (
    <header className="sticky top-0 z-10 bg-slate-50/95 border-b border-slate-200 px-4 py-4 backdrop-blur sm:px-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Painel de frota</h1>
          <p className="text-sm text-slate-500">Controle de reservas, disponibilidade e histórico.</p>
        </div>
        <button onClick={logout} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Sair
        </button>
      </div>
    </header>
  );
};

export default Topbar;
