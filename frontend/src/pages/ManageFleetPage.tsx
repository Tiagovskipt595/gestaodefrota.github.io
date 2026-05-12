import { useEffect, useState } from 'react';
import api from '../api';
import { Vehicle } from '../types';
import { getUser } from '../auth';

const ManageFleetPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState<any>({ status: 'available', year: new Date().getFullYear() });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const user = getUser();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.plate || !formData.brand || !formData.model || !formData.year) {
      setMessage('Preencha os campos obrigatórios.');
      return;
    }

    // Validate plate format: 00-AA-00
    const plateRegex = /^\d{2}-[A-Z]{2}-\d{2}$/;
    if (!plateRegex.test(formData.plate)) {
      setMessage('Formato de matrícula inválido. Use o formato 00-AA-00 (ex: 12-AB-34).');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, formData);
        setMessage('Viatura atualizada com sucesso.');
      } else {
        await api.post('/vehicles', formData);
        setMessage('Viatura criada com sucesso.');
      }
      setFormData({ status: 'available', year: new Date().getFullYear() });
      setEditingId(null);
      loadVehicles();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao processar viatura.');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setFormData(vehicle);
    setEditingId(vehicle.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja remover esta viatura?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setMessage('Viatura removida com sucesso.');
      loadVehicles();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao remover viatura.');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    if (!vehicle) return;
    try {
      await api.put(`/vehicles/${id}`, { ...vehicle, status: newStatus });
      loadVehicles();
    } catch (err) {
      setMessage('Erro ao mudar estado da viatura.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Gerir Frota</h2>
        <p className="mt-2 text-slate-600">Adicione, edite ou remova viaturas. Gerencie estado de utilização.</p>
      </div>

      {user?.role !== 'user' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">{editingId ? 'Editar viatura' : 'Nova viatura'}</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700">Matrícula *</label>
              <input
                type="text"
                value={formData.plate || ''}
                onChange={(e) => {
                  let value = e.target.value.toUpperCase();
                  // Remove everything except A-Z and 0-9
                  value = value.replace(/[^A-Z0-9]/g, '');
                  // Limit to 6 characters (for the alphanumeric part)
                  if (value.length > 6) value = value.substring(0, 6);

                  // Build formatted string with validation per section
                  let formatted = '';

                  // First two: must be digits
                  if (value.length >= 1) {
                    formatted += /[0-9]/.test(value[0]) ? value[0] : '';
                  }
                  if (value.length >= 2) {
                    formatted += /[0-9]/.test(value[1]) ? value[1] : '';
                  }

                  // Add first hyphen
                  if (value.length >= 2) {
                    formatted += '-';
                  }

                  // Next two: must be letters
                  if (value.length >= 3) {
                    formatted += /[A-Z]/.test(value[2]) ? value[2] : '';
                  }
                  if (value.length >= 4) {
                    formatted += /[A-Z]/.test(value[3]) ? value[3] : '';
                  }

                  // Add second hyphen
                  if (value.length >= 4) {
                    formatted += '-';
                  }

                  // Last two: must be digits
                  if (value.length >= 5) {
                    formatted += /[0-9]/.test(value[4]) ? value[4] : '';
                  }
                  if (value.length >= 6) {
                    formatted += /[0-9]/.test(value[5]) ? value[5] : '';
                  }

                  setFormData({ ...formData, plate: formatted });
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="00-AA-00"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Marca *</label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Toyota"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Modelo *</label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Corolla"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Ano *</label>
                <input
                  type="number"
                  value={formData.year || new Date().getFullYear()}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tipo</label>
                <input
                  type="text"
                  value={formData.type || ''}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  placeholder="Sedan"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Estado</label>
              <select
                value={formData.status || 'available'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="available">Disponível</option>
                <option value="reserved">Reservada</option>
                <option value="in_use">Em utilização</option>
                <option value="maintenance">Manutenção</option>
                <option value="inactive">Inativa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Quilometragem</label>
              <input
                type="text"
                value={formData.mileage ?? ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, mileage: value });
                }}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                placeholder="0"
                inputmode="numeric"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <label className="block font-medium text-slate-700">Próx. Inspeção</label>
                <input
                  type="date"
                  value={formData.nextInspection || ''}
                  onChange={(e) => setFormData({ ...formData, nextInspection: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700">Próx. Seguro</label>
                <input
                  type="date"
                  value={formData.nextInsurance || ''}
                  onChange={(e) => setFormData({ ...formData, nextInsurance: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700">Próx. Revisão</label>
                <input
                  type="date"
                  value={formData.nextService || ''}
                  onChange={(e) => setFormData({ ...formData, nextService: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Observações</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                rows={3}
              />
            </div>

            {message && <p className="text-sm text-slate-600">{message}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {editingId ? 'Atualizar' : 'Criar viatura'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ status: 'available', year: new Date().getFullYear() });
                    setEditingId(null);
                  }}
                  className="rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Viaturas</h3>
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{vehicle.plate}</p>
                      <p className="text-sm text-slate-600">{vehicle.brand} {vehicle.model} • {vehicle.year}</p>
                      <p className="text-sm text-slate-600">{vehicle.mileage} km</p>
                      {vehicle.nextInspection && (
                        <p className="text-sm text-slate-600">
                          Próx. Inspeção: {new Date(vehicle.nextInspection).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                      {vehicle.nextInsurance && (
                        <p className="text-sm text-slate-600">
                          Próx. Seguro: {new Date(vehicle.nextInsurance).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                      {vehicle.nextService && (
                        <p className="text-sm text-slate-600">
                          Próx. Revisão: {new Date(vehicle.nextService).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
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
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(vehicle)}
                      className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-xs font-medium text-slate-900 transition hover:bg-slate-300"
                    >
                      Editar
                    </button>
                    {(user.role === 'admin' || user.role === 'manager') && (
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="flex-1 rounded-lg bg-rose-100 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {user?.role === 'user' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Você não tem permissão para gerir a frota. Contacte um administrador.</p>
        </div>
      )}
    </div>
  );
};

export default ManageFleetPage;
