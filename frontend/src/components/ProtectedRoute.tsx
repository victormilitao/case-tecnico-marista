import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthRole } from '../types';

interface Props {
  role?: AuthRole;
}

export function ProtectedRoute({ role }: Props) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Carregando...
      </div>
    );
  }
  if (!user) {
    return <Navigate to={role === 'student' ? '/aluno/login' : '/login'} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'student' ? '/aluno' : '/dashboard'} replace />;
  }
  return <Outlet />;
}
