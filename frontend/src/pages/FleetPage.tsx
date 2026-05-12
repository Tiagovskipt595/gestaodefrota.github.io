import { useEffect, useState } from 'react';
import { Vehicle } from '../types';
import api from '../api';
import { getUser } from '../auth';

const FleetPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const user = getUser();
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const fetchVehicles = () => {
      api.get('/vehicles').then((response) => setVehicles(response.data)).catch(console.error);
    };

    // Initial fetch
    fetchVehicles();

    // Listen for vehicle mileage updates from sidebar
    const handleVehicleMileageUpdate = () => {
      fetchVehicles();
    };

    window.addEventListener('vehicleMileageUpdated', handleVehicleMileageUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('vehicleMileageUpdated', handleVehicleMileageUpdate);
    };
  }, []); // Empty deps means this runs once on mount

  const filtered = vehicles.filter((vehicle) =>
    [vehicle.plate, vehicle.brand, vehicle.model, vehicle.type, vehicle.status].some((value) =>
      value?.toString().toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleStatusChange = async (id: number, newStatus: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return;
    try {
      await api.put(`/vehicles/${id}`, { ...vehicle, status: newStatus });
      setVehicles(vehicles.map((v) => (v.id === id ? { ...v, status: newStatus } : v)));
    } catch (err) {
      console.error('Erro ao mudar estado:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Frota</h2>
        <p className="mt-2 text-slate-600">Visualize todas as viaturas, estado e informações operacionais.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Pesquise viaturas por matrícula, marca ou estado.</p>
          <input
            className="max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-900"
            placeholder="Pesquisar..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Matrícula</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Ano</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Quilometragem</th>
                {canManage && <th className="px-4 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-4 py-4 font-medium text-slate-900">{vehicle.plate}</td>
                  <td className="px-4 py-4 text-slate-600">{vehicle.brand}</td>
                  <td className="px-4 py-4 text-slate-600">{vehicle.model}</td>
                  <td className="px-4 py-4 text-slate-600">{vehicle.year}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      vehicle.status === 'available'
                        ? 'bg-emerald-100 text-emerald-700'
                        : vehicle.status === 'reserved'
                        ? 'bg-amber-100 text-amber-700'
                        : vehicle.status === 'in_use'
                        ? 'bg-blue-100 text-blue-700'
                        : vehicle.status === 'maintenance'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {vehicle.status === 'available' ? 'Disponível' : vehicle.status === 'reserved' ? 'Reservada' : vehicle.status === 'in_use' ? 'Em uso' : vehicle.status === 'maintenance' ? 'Manutenção' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{typeof vehicle.mileage === 'number' ? vehicle.mileage.toLocaleString() : vehicle.mileage} km</td>
                  {canManage && (
                    <td className="px-4 py-4">
                      <select
                        value={vehicle.status}
                        onChange={(e) => handleStatusChange(vehicle.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium outline-none focus:border-slate-900"
                      >
                        <option value="available">Disponível</option>
                        <option value="reserved">Reservada</option>
                        <option value="in_use">Em uso</option>
                        <option value="maintenance">Manutenção</option>
                        <option value="inactive">Inativa</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FleetPage;