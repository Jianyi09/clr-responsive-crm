import { createBrowserRouter, Navigate } from 'react-router';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Equipos } from './pages/Equipos';
import { Modelos } from './pages/Modelos';
import { NotFound } from './pages/NotFound';
import { Layout } from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clientes',
    element: (
      <ProtectedRoute>
        <Clientes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/equipos',
    element: (
      <ProtectedRoute>
        <Equipos />
      </ProtectedRoute>
    ),
  },
  {
    path: '/modelos',
    element: (
      <ProtectedRoute>
        <Modelos />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);