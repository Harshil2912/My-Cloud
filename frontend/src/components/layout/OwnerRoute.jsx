import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isOwnerUser } from '../../utils/isOwnerUser';

export function OwnerRoute({ children }) {
  const { user } = useAuth();

  if (!isOwnerUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
