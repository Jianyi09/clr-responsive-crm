import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';

// 1. Inicializamos el QueryClient con configuraciones ideales para la PWA
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // Considera los datos "frescos" por 5 minutos
      gcTime: 1000 * 60 * 60 * 24,  // Mantiene la caché en memoria por 24 horas si estás offline
      refetchOnWindowFocus: false,  // Evita recargas molestas al cambiar de pestaña
      retry: 1,                     // Si falla por red, reintenta una vez antes de avisar
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}