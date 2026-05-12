import { useEffect, useState } from 'react';
import api from '../api';
import { Reservation } from '../types';
import { getUser } from '../auth';

const CalendarPage = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState<Date>(new Date());
  const user = getUser();

  useEffect(() => {
    api.get('/reservations').then((response) => setReservations(response.data)).catch(console.error);
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getReservationsForDate = (dateString: string) => {
    const selectedDate = new Date(dateString);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);

    return reservations.filter(res => {
      const start = new Date(res.startAt);
      const end = new Date(res.endAt);
      return startOfDay < end && endOfDay > start;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Calendário de reservas</h2>
        <p className="mt-2 text-slate-600">Vista diária e relatório de conflitos de horário.</p>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="mt-6">
          {/* Calendar header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDisplayDate(prev => {
                  const newDate = new Date(prev);
                  newDate.setMonth(newDate.getMonth() - 1);
                  return newDate;
                })}
                className="text-slate-500 hover:text-slate-700"
              >
                ‹
              </button>
              <button
                onClick={() => setDisplayDate(prev => {
                  const newDate = new Date(prev);
                  newDate.setFullYear(newDate.getFullYear() - 1);
                  return newDate;
                })}
                className="text-slate-500 hover:text-slate-700"
              >
                «
              </button>
            </div>
            <h4 className="text-lg font-medium">{new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</h4>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setDisplayDate(prev => {
                  const newDate = new Date(prev);
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  return newDate;
                })}
                className="text-slate-500 hover:text-slate-700"
              >
                »
              </button>
              <button
                onClick={() => setDisplayDate(prev => {
                  const newDate = new Date(prev);
                  newDate.setMonth(newDate.getMonth() + 1);
                  return newDate;
                })}
                className="text-slate-500 hover:text-slate-700"
              >
                ›
              </button>
            </div>
          </div>
          {/* Weekdays */}
          <div className="grid grid-cols-7 text-center text-slate-500 text-sm mb-2">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* We'll generate days here */}
            {Array.from({ length: getDaysInMonth(displayDate) }, (_, index) => {
              const day = index + 1;
              const date = new Date(displayDate);
              date.setDate(day);
              const dateStr = date.toISOString().split('T')[0];
              const isReserved = reservations.some(res => {
                const start = new Date(res.startAt);
                const end = new Date(res.endAt);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                return dayStart < end && dayEnd > start;
              });
              const isOwnReservation = reservations.some(res => {
                const start = new Date(res.startAt);
                const end = new Date(res.endAt);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                return dayStart < end && dayEnd > start && res.userId === user?.id;
              });
              const today = new Date();
              today.setHours(0,0,0,0);
              const isToday = date.getTime() === today.getTime();
              const isSelected = selectedDate === dateStr;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(selectedDate === dateStr ? null : dateStr)}
                  className={`w-full h-12 flex items-center justify-center rounded border cursor-pointer
                  ${isOwnReservation ? 'bg-green-500 text-white' : isReserved && !isOwnReservation ? 'bg-red-500 text-white' : 'bg-slate-50 hover:bg-slate-100'}
                  ${isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-50 border-blue-500' : ''}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              Reservas para {new Date(selectedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </h3>
            {getReservationsForDate(selectedDate).length > 0 ? (
              <div className="space-y-4">
                {getReservationsForDate(selectedDate).map(reservation => (
                  <div key={reservation.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {reservation.brand && reservation.model
                            ? `${reservation.brand} ${reservation.model} (${reservation.plate || reservation.vehicleId})`
                            : `Viatura ${reservation.plate || reservation.vehicleId}`}
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(reservation.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })} -
                          {new Date(reservation.endAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </p>
                        {reservation.destination && (
                          <p className="text-sm text-slate-600 mt-1">{reservation.destination}</p>
                        )}
                        {reservation.purpose && (
                          <p className="text-sm text-slate-600 mt-1">{reservation.purpose}</p>
                        )}
                      </div>
                      {!reservation.userId && (
                        <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Sem condutor
                        </span>
                      )}
                      {reservation.userId && reservation.driverName && (
                        <span className={`px-3 py-1 text-xs font-medium ${
                          reservation.userId === user?.id
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        } rounded-full`}>
                          {reservation.userId === user?.id ? 'Sua reserva' : reservation.driverName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500">Nenhuma reserva encontrada para esta data.</p>
            )}
          </div>
        )}

        {!reservations.length && <p className="mt-4 text-center text-slate-500">Nenhuma reserva encontrada para {displayDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.</p>}
      </div>
    </div>
  );
};

export default CalendarPage;
