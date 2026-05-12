import { getUser } from '../auth';
import { useEffect, useState } from 'react';
import api from '../api';

const ProfilePage = () => {
  const user = getUser();

  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return null;
  }

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    if (!window.confirm('Tem a certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete('/auth/me');
      // Clear local storage and redirect to login
      localStorage.removeItem('fleet-token');
      localStorage.removeItem('fleet-user');
      window.location.href = '/login';
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Erro ao excluir conta');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Meu Perfil</h2>
        <p className="mt-2 text-slate-600">Visualize e edite suas informações pessoais.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Informações Pessoais</h3>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">Nome completo</p>
            <p className="mt-1 text-lg text-slate-900">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">E-mail</p>
            <p className="mt-1 text-lg text-slate-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Perfil</p>
            <p className="mt-1 text-lg text-slate-900">
              {user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gestor de Frota' : 'Usuário'}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Departamento</p>
            <p className="mt-1 text-lg text-slate-900">{user.department || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Telefone</p>
            <p className="mt-1 text-lg text-slate-900">{user.phone || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Licença válida até</p>
            <p className="mt-1 text-lg text-slate-900">
              {user.licenseValidUntil ? (
                <span>
                  {new Date(user.licenseValidUntil).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              ) : (
                'Não informado'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Optional: Edit profile form could be added here */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Alterar Senha</h3>
        <p className="mt-2 text-slate-600">
          Para alterar sua senha, entre em contato com o administrador ou use a funcionalidade de redefinir senha (em desenvolvimento).
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Excluir Conta</h3>
        {deleteError && <p className="text-sm text-red-600 mb-2">{deleteError}</p>}
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className={`w-full rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 ${
            deleteLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {deleteLoading ? 'Excluindo...' : 'Excluir Conta'}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;