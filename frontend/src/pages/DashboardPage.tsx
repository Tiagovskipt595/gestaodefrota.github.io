import { useEffect, useState } from 'react';
import api from '../api';

const DashboardPage = () => {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get('/reports/summary')
      .then((response) => setSummary(response.data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-slate-600">Resumo de frota, reservas e alertas operacionais.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Total de viaturas</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{summary?.totalVehicles ?? '–'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Disponíveis</p>
          <p className="mt-4 text-3xl font-semibold text-emerald-600">{summary?.available ?? '–'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Reservadas</p>
          <p className="mt-4 text-3xl font-semibold text-amber-600">{summary?.reserved ?? '–'}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Em manutenção</p>
          <p className="mt-4 text-3xl font-semibold text-rose-600">{summary?.maintenance ?? '–'}</p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Próximas reservas</h3>
          <div className="mt-4 space-y-4">
            {summary?.upcoming?.length ? (
              summary.upcoming.map((reservation: any) => (
                <div key={reservation.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{reservation.plate} • {reservation.brand}</p>
                  <p className="text-sm text-slate-600">Início: {new Date(reservation.startAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                  <p className="text-sm text-slate-600">Condutor: {reservation.name || reservation.driverName}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Nenhuma reserva futura encontrada.</p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Indicadores</h3>
          <p className="mt-4 text-slate-600">Quilómetros totais registados na frota:</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{summary?.kmTotal ?? '–'}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
