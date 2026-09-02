import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect = {
      CUSTOMER: '/customer',
      INDIVIDUAL_PROVIDER: '/provider',
      THIRD_PARTY_PARTNER: '/partner',
      SUPPORT_AGENT: '/support-desk',
      SENIOR_SUPPORT_AGENT: '/support-desk',
      ADMIN: '/admin',
    };
    return <Navigate to={redirect[user.role] || '/'} replace />;
  }
  return children;
}
