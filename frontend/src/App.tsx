import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import FleetPage from './pages/FleetPage';
import ManageFleetPage from './pages/ManageFleetPage';
import ReservationsPage from './pages/ReservationsPage';
import CalendarPage from './pages/CalendarPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import { getToken, getUser } from './auth';
import ProfilePage from './pages/ProfilePage';
import ManageReservationsPage from './pages/ManageReservations';

const App = () => {
  const location = useLocation();
  const token = getToken();
  const user = getUser();
  const openLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {token && <Sidebar />}
      <div className={`${token ? 'md:pl-72' : ''}`}>
        {token && <Topbar />}
        <main className="px-4 py-6 md:px-10">
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  {user?.role === 'user' ? <ReservationsPage /> : <DashboardPage />}
                </ProtectedRoute>
              }
            />
            <Route
              path="/fleet"
              element={
                <ProtectedRoute>
                  <FleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-fleet"
              element={
                <ProtectedRoute>
                  <ManageFleetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <ReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute>
                  <ManageUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-reservations"
              element={
                <ProtectedRoute>
                  <ManageReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;