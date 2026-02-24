import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, authError, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--k-bg)]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--k-primary)] border-t-transparent mx-auto" />
          <p className="mt-4 text-[var(--k-muted)]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--k-bg)]">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-[var(--k-danger)]">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[var(--k-primary)] rounded-lg hover:brightness-110 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && !requiredRoles.some((role) => hasRole(role))) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
