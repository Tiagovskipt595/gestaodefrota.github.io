import { useEffect, useState } from 'react';
import api from '../api';
import { Reservation } from '../types';
import { getUser } from '../auth';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<Array<{id: number; plate: string; brand: string; model: string}>>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Array<{id: number; plate: string; brand: string; model: string}>>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesResp, reservationsResp] = await Promise.all([
          api.get('/vehicles'),
          api.get('/reservations')
        ]);
        setVehicles(vehiclesResp.data);
        setReservations(reservationsResp.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      }
    };
    fetchData();
  }, []);

  // Calculate available vehicles when dates change
  useEffect(() => {
    if (!startDateTime || !endDateTime) {
      // If no dates selected, show all vehicles
      setAvailableVehicles(vehicles);
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    // Filter vehicles: available if no overlapping reservation
    const availableVehicles = vehicles.filter(vehicle => {
      return !reservations.some(reservation => {
        if (Number(reservation.vehicleId) !== Number(vehicle.id)) return false;

        const resStart = new Date(reservation.startAt);
        const resEnd = new Date(reservation.endAt);

        // Check for overlap: [start, end] overlaps with [resStart, resEnd]
        return start < resEnd && end > resStart;
      });
    });

    setAvailableVehicles(availableVehicles);
  }, [startDateTime, endDateTime, vehicles, reservations]);



  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check if vehicle is already selected for the time period
    if (!startDateTime || !endDateTime) {
      setMessage('Por favor, selecione data e hora de início e fim.');
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    const conflictingReservation = reservations.find(reservation => {
      if (Number(reservation.vehicleId) !== Number(vehicleId)) return false;

      const resStart = new Date(reservation.startAt);
      const resEnd = new Date(reservation.endAt);

      // Check for overlap: [start, end] overlaps with [resStart, resEnd]
      return start < resEnd && end > resStart;
    });

    if (conflictingReservation) {
      setMessage('Já existe uma reserva para esta viatura no período selecionado. Por favor, escolha outro horário ou viatura.');
      return;
    }

    try {
      const user = getUser();
      await api.post('/reservations', {
        vehicleId: Number(vehicleId),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        purpose,
        destination
      });
      setMessage('Reserva criada com sucesso. Após o término da reserva, você será solicitado a registrar a quilometragem final.');

      setVehicleId('');
      setStartDateTime('');
      setEndDateTime('');
      setPurpose('');
      setDestination('');
      const response = await api.get('/reservations');
      setReservations(response.data);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao criar reserva.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Reservas e marcações</h2>
        <p className="mt-2 text-slate-600">Crie, edite e confira conflitos de horários em tempo real.</p>
      </div>

      {/* Reserva Nova Section */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Nova reserva</h3>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Viatura</label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900" disabled={availableVehicles.length === 0}>
              <option value="">Selecione uma viatura</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate} - {v.brand} {v.model}
                </option>
              ))}
              {availableVehicles.length === 0 && (
                <option disabled>Nenhuma viatura disponível para este período</option>
              )}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Início</label>
              <input type="datetime-local" value={startDateTime} onChange={(e) => setStartDateTime(e.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fim</label>
              <input type="datetime-local" value={endDateTime} onChange={(e) => setEndDateTime(e.target.value)} required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Motivo</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Destino</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900" />
          </div>
          {message && <p className="text-sm text-slate-600">{message}</p>}
          <button type="submit" className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            Criar reserva
          </button>
        </form>
      </div>

    </div>
  );
};

export default ReservationsPage;
