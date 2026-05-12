import { useEffect, useState } from 'react';
import api from '../api';
import { Reservation } from '../types';
import { getUser } from '../auth';

const ManageReservationsPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [formData, setFormData] = useState<Partial<Reservation>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled'>('all');
  // Form fields for editing
  const [vehicleId, setVehicleId] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  // Vehicle data for dropdown
  const [vehicles, setVehicles] = useState<Array<{id: number; plate: string; brand: string; model: string}>>([]);
  const user = getUser();

  useEffect(() => {
    loadReservations();
    loadVehicles();
  }, []);

  const loadReservations = async () => {
    try {
      const response = await api.get('/reservations');
      setReservations(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      const vehiclesData = response.data;
      // Format data for dropdown
      const formattedVehicles = vehiclesData.map((vehicle: any) => ({
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model
      }));
      setVehicles(formattedVehicles);
    } catch (err) {
      console.error('Failed to load vehicles', err);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) {
      setMessage('Selecione uma reserva para editar.');
      return;
    }

    // Validate required fields
    if (!startDateTime || !endDateTime || !vehicleId) {
      setMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Build update data from formData, converting specific fields as needed
    const updateData: Partial<Reservation> = {
      ...formData,
      vehicleId: Number(vehicleId),
      startAt: new Date(startDateTime).toISOString(),
      endAt: new Date(endDateTime).toISOString(),
      startMileage: formData.startMileage ? Number(formData.startMileage) : undefined,
      endMileage: formData.endMileage ? Number(formData.endMileage) : undefined,
    };

    try {
      await api.put(`/reservations/${editingId}`, updateData);
      setMessage('Reserva atualizada com sucesso.');
      setFormData({});
      setEditingId(null);
      // Reset form fields
      setVehicleId('');
      setStartDateTime('');
      setEndDateTime('');
      loadReservations();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao atualizar reserva.');
    }
  };

  const handleEdit = (reservation: Reservation) => {
    // Set form data with all reservation fields
    setFormData({
      ...reservation,
      // Ensure we don't overwrite with undefined or empty strings
      purpose: reservation.purpose ?? '',
      destination: reservation.destination ?? '',
      status: reservation.status ?? 'confirmed',
      notes: reservation.notes ?? '',
      startMileage: reservation.startMileage?.toString() ?? '',
      endMileage: reservation.endMileage?.toString() ?? '',
    });

    // Set datetime fields for the form (format for datetime-local input: YYYY-MM-DDTHH:mm)
    setVehicleId(reservation.vehicleId.toString());
    setStartDateTime(new Date(reservation.startAt).toISOString().slice(0, 16));
    setEndDateTime(new Date(reservation.endAt).toISOString().slice(0, 16));

    setEditingId(reservation.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja remover esta reserva?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      setMessage('Reserva removida com sucesso.');
      loadReservations();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao remover reserva.');
    }
  };

  const getReservationCardClass = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 border-amber-200';
      case 'confirmed':
        return 'bg-blue-50 border-blue-200';
      case 'in_use':
        return 'bg-green-50 border-green-200';
      case 'completed':
        return 'bg-green-100 border-green-200';
      case 'cancelled':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendentes';
      case 'confirmed':
        return 'Confirmadas';
      case 'in_use':
        return 'Em uso';
      case 'completed':
        return 'Concluídas';
      case 'cancelled':
        return 'Canceladas';
      default:
        return '';
    }
  };

  const getDisplayStatus = (reservation: Reservation): string => {
    if (reservation.status === 'cancelled' || reservation.status === 'completed') {
      return reservation.status;
    }
    const now = new Date();
    const start = new Date(reservation.startAt);
    const end = new Date(reservation.endAt);
    if (now >= start && now <= end) {
      return 'in_use';
    }
    if (now > end) {
      return 'completed';
    }
    return reservation.status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Gerir Reservas</h2>
        <p className="mt-2 text-slate-600">Visualize, edite ou remova reservas. Apenas administradores e gestores podem aceder a esta página.</p>
      </div>

      {user?.role !== 'user' && (
        <div className="gap-6 lg:grid-cols-[1.2fr_1fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Editar reserva</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700">Viatura</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="">Selecione uma viatura</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.plate} - {v.brand} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Início</label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Fim</label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Propósito</label>
              <input
                type="text"
                value={formData.purpose ?? ''}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Reunião com cliente"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Destino</label>
              <input
                type="text"
                value={formData.destination ?? ''}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="Lisboa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Estado</label>
              <select
                value={formData.status ?? 'confirmed'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="confirmed">Confirmada</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Concluída</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Observações</label>
              <textarea
                value={formData.notes ?? ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Quilometragem inicial</label>
                <input
                  type="number"
                  value={formData.startMileage ?? ''}
                  onChange={(e) => setFormData({ ...formData, startMileage: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Quilometragem final</label>
                <input
                  type="number"
                  value={formData.endMileage ?? ''}
                  onChange={(e) => setFormData({ ...formData, endMileage: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {message && <p className="text-sm text-slate-600">{message}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Atualizar
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({});
                    setEditingId(null);
                  }}
                  className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">Pendente</span>
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Confirmada</span>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Em uso</span>
              <span className="px-3 py-1 text-xs font-medium bg-green-200 text-green-800 rounded-full">Concluída</span>
              <span className="px-3 py-1 text-xs font-medium bg-rose-100 text-rose-800 rounded-full">Cancelada</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 text-xs font-medium ${filterStatus === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'} rounded-full`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 text-xs font-medium ${filterStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'} rounded-full`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilterStatus('confirmed')}
                className={`px-3 py-1 text-xs font-medium ${filterStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'} rounded-full`}
              >
                Confirmadas
              </button>
              <button
                onClick={() => setFilterStatus('in_use')}
                className={`px-3 py-1 text-xs font-medium ${filterStatus === 'in_use' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'} rounded-full`}
              >
                Em uso
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 text-xs font-medium ${filterStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'} rounded-full`}
              >
                Concluídas
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`px-3 py-1 text-xs font-medium ${filterStatus === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-800'} rounded-full`}
              >
                Canceladas
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Reservas {filterStatus !== 'all' ? `(${getStatusLabel(filterStatus)})` : ''}
            </h3>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {reservations
                .filter(reservation => filterStatus === 'all' || getDisplayStatus(reservation) === filterStatus)
                .map((reservation) => (
                <div key={reservation.id} className={`rounded-2xl border border-slate-200 p-4 ${getReservationCardClass(getDisplayStatus(reservation))}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">#{reservation.id}</p>
                      <p className="text-sm text-slate-600">
                        {reservation.brand} {reservation.model} ({reservation.plate})
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(reservation.startAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })} -
                        {new Date(reservation.endAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </p>
                      <p className="text-sm text-slate-600">Estado: {getDisplayStatus(reservation)}</p>
                      {reservation.purpose && (
                        <p className="text-sm text-slate-600">Propósito: {reservation.purpose}</p>
                      )}
                      {reservation.destination && (
                        <p className="text-sm text-slate-600">Destino: {reservation.destination}</p>
                      )}
                      {reservation.notes && (
                        <p className="text-sm text-slate-600">Observações: {reservation.notes}</p>
                      )}
                      {reservation.driverName && (
                        <p className="text-sm text-slate-600">
                          Condutor: {reservation.driverName}
                        </p>
                      )}
                      {reservation.startMileage != null && (
                        <p className="text-sm text-slate-600">
                          Quilometragem inicial: {reservation.startMileage.toLocaleString()} km
                        </p>
                      )}
                      {reservation.endMileage != null && (
                        <p className="text-sm text-slate-600">
                          Quilometragem final: {reservation.endMileage.toLocaleString()} km
                        </p>
                      )}
                      {reservation.startMileage != null && reservation.endMileage != null && (
                        <p className="text-sm text-slate-600 font-medium">
                          Quilómetros percorridos: {(reservation.endMileage - reservation.startMileage).toLocaleString()} km
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(reservation)}
                        className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-300"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        className="flex-1 rounded-lg bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'user' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Você não tem permissão para gerir reservas. Contacte um administrador.</p>
        </div>
      )}
    </div>
  );
};

export default ManageReservationsPage;