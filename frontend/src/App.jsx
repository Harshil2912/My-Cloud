import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { OwnerRoute }     from './components/layout/OwnerRoute';
import { Navbar }         from './components/layout/Navbar';
import { Sidebar }        from './components/layout/Sidebar';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import DashboardPage      from './pages/DashboardPage';
import UploadPage         from './pages/UploadPage';
import SharedWithMePage   from './pages/SharedWithMePage';
import HealthPage         from './pages/HealthPage';
import ProfilePage        from './pages/ProfilePage';

function AppLayout({ children }) {
  return (
    <div className="app-atmosphere flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden px-4 pb-4 pt-3 sm:px-5">
        <Sidebar />
        <main className="flex-1 overflow-auto pl-4">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<LoginPage    />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout><Routes><Route path="*" element={null} /></Routes></AppLayout>}>
          {/* Nest a secondary router via index/context is cleaner: */}
        </Route>
        <Route path="/dashboard" element={<AppLayout><DashboardPage    /></AppLayout>} />
        <Route path="/upload"    element={<AppLayout><UploadPage        /></AppLayout>} />
        <Route path="/shared"    element={<AppLayout><SharedWithMePage  /></AppLayout>} />
        <Route path="/profile"   element={<AppLayout><ProfilePage       /></AppLayout>} />
        <Route path="/health"    element={<AppLayout><OwnerRoute><HealthPage /></OwnerRoute></AppLayout>} />
        <Route path="/"          element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
