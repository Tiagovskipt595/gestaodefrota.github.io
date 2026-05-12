import { useEffect, useState } from 'react';
import api from '../api';

const ReportsPage = () => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get('/reports/summary')
      .then((response) => setSummary(response.data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Relatórios</h2>
        <p className="mt-2 text-slate-600">Métricas por viatura, condutor e períodos de utilização.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Total de viaturas</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{summary?.totalVehicles ?? '–'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Utilizações confirmadas</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{summary?.upcoming?.length ?? '–'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Quilómetros totais</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{summary?.kmTotal ?? '–'}</p>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Exportar relatórios</h3>
        <p className="mt-3 text-slate-600">Os dados podem ser filtrados por viatura, condutor e período na próxima expansão.</p>
        <button className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          Exportar CSV
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
