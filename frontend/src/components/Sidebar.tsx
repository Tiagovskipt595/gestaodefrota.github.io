import { NavLink, Link } from 'react-router-dom';
import { getUser, logout } from '../auth';
import api from '../api';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin || isManager;
  const [reservations, setReservations] = useState([]);
  const [pendingMileageReservations, setPendingMileageReservations] = useState([]);
  const [mileageFormData, setMileageFormData] = useState({});
  const [showMileageModal, setShowMileageModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchReservations = async () => {
        try {
          const response = await api.get('/reservations');
          // For admins and managers, show all reservations; for regular users, only their own
          const allReservations = isAdmin || isManager ? response.data : response.data.filter(res => res.userId === user.id);
          setReservations(allReservations);

          // Filter reservations that need mileage entry (ended but mileage not recorded)
          const now = new Date();
          const pending = allReservations.filter(res => {
            const endTime = new Date(res.endAt);
            // Reservation has ended but mileage not recorded (assuming 0 or null means not recorded)
            return endTime < now && (res.endMileage === null || res.endMileage === 0 || !res.endMileage);
          });
          setPendingMileageReservations(pending);
        } catch (err) {
          console.error('Failed to fetch reservations:', err);
        }
      };

      fetchReservations();

      // Also set up an interval to check for pending mileage reservations
      const interval = setInterval(fetchReservations, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [user, isAdmin, isManager]);

  const handleMileageSubmit = async (e) => {
    e.preventDefault();
    const reservationId = mileageFormData.id;
    const endMileage = Number(mileageFormData.endMileage);
    alert(`Submitting mileage for reservation ${reservationId}: ${endMileage}`);

    // Build update data from the reservation, overriding endMileage and setting status to completed
    const updateData = {
      ...mileageFormData,
      endMileage: endMileage,
      status: 'completed',
      // Ensure startMileage is a number if present
      startMileage: mileageFormData.startMileage != null ? Number(mileageFormData.startMileage) : null
    };

    try {
      await api.put(`/reservations/${reservationId}`, updateData);
      // Update local state
      setReservations(prev => prev.map(res =>
        res.id === reservationId ? {...res, endMileage: updateData.endMileage, status: updateData.status} : res
      ));
      setPendingMileageReservations(prev => prev.filter(res => res.id !== reservationId));
      setShowMileageModal(false);
      setMileageFormData({});
      // Note: In a real app, you might want to show a success message
      alert('Quilometragem registrada com sucesso!');

      // The backend will automatically update the vehicle's mileage when reservation is completed
      // Trigger event to notify other components (like FleetPage) to refresh vehicle data
      window.dispatchEvent(new Event('vehicleMileageUpdated'));
    } catch (err) {
      console.error('Failed to submit mileage:', err);
      // Show error message to user
      alert('Erro ao registrar quilometragem: ' + err.message);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-72 overflow-y-auto border-r border-slate-200 bg-white px-6 py-8 shadow-sm md:shadow-none">
      <div className="mb-8">
        <div className="text-2xl font-semibold text-slate-900">Gestão de Frota</div>
        <p className="mt-2 text-sm text-slate-600">Plataforma interna para reservas e historial.</p>
      </div>

      <nav className="space-y-2">
        {user?.role === 'admin' || user?.role === 'manager' ? (
          <>
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2">Principal</p>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </div>
          </>
        ) : null}

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2">Reservas</p>
          <NavLink
            to="/reservations"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            Reservas
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            Calendário
          </NavLink>
        </div>

        {/* Pending mileage reservations section - only for admins and managers */}
        {(isAdmin || isManager) && pendingMileageReservations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2">Registrar Quilometragem</p>
            {pendingMileageReservations.map(reservation => {
              const formatDateTime = (dateString) => {
                const d = new Date(dateString);
                return d.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
              };
              return (
                <div key={reservation.id} className="mb-2 p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-slate-900">#{reservation.id}</span>
                    <span className="text-xs text-slate-500">
                      {formatDateTime(reservation.startAt)} -
                      {formatDateTime(reservation.endAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {reservation.brand} {reservation.model} ({reservation.plate})
                  </p>
                  <button
                    onClick={async () => {
                      try {
                        const vehicleResp = await api.get(`/vehicles/${reservation.vehicleId}`);
                        const vehicleMileage = vehicleResp.data.mileage;

                        setMileageFormData({
                          ...reservation,
                          startMileage: reservation.startMileage ?? vehicleMileage
                        });
                        setShowMileageModal(true);
                      } catch (err) {
                        console.error('Erro ao carregar quilometragem da viatura:', err);
                        setMileageFormData(reservation);
                        setShowMileageModal(true);
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Registrar KM Final
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2">Informações</p>
          <NavLink
            to="/fleet"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            Frota
          </NavLink>
          {(isAdmin || isManager) && (
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Relatórios
            </NavLink>
          )}
        </div>

        {canManage && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2">Gestão</p>
            <NavLink
              to="/manage-fleet"
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Gerir frota
            </NavLink>
            <NavLink
              to="/manage-users"
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Gerir utilizadores
            </NavLink>
            <NavLink
              to="/manage-reservations"
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              Gerir reservas
            </NavLink>
          </div>
        )}

        {/* Logout section */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2">Conta</p>
          {user && (
            <Link to="/profile" className="block">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-600">{user.email}</p>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  user.role === 'admin'
                    ? 'bg-slate-900 text-white'
                    : user.role === 'manager'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-700'
                }`}>
                  {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gestor' : 'Utilizador'}
                </span>
              </div>
            </Link>
          )}
          <button
            onClick={logout}
            className="block w-full text-left text-xs uppercase tracking-wider text-slate-400 font-semibold px-4 py-2"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Mileage entry modal */}
      {showMileageModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Registrar Quilometragem Final</h3>
            <form onSubmit={handleMileageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Quilometragem Inicial (referência)</label>
                <p className="mt-1 text-sm text-slate-600">
                  {mileageFormData.startMileage != null ? mileageFormData.startMileage.toLocaleString() : '0'} km
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Quilometragem Final</label>
                <input
                  type="number"
                  value={mileageFormData.endMileage || ''}
                  onChange={(e) => setMileageFormData({...mileageFormData, endMileage: e.target.value})}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  required
                />
                {mileageFormData.startMileage >= 0 && mileageFormData.endMileage > 0 && (
                  <p className="mt-1 text-sm text-slate-600">
                    Quilómetros a percorrer: {Number(mileageFormData.endMileage) - mileageFormData.startMileage} km
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowMileageModal(false);
                    setMileageFormData({});
                  }}
                  className="mr-2 px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;