import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { API_BASE_URL } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Importamos iconos estilizados de la librería lucide-react para la interfaz gráfica
import { Building2, MapPin, Phone, Mail, Search, Plus } from 'lucide-react';

// Importamos la definición de tipo 'Cliente' y 'Equipo'
import { type Cliente, type Equipo } from '../data/mockData';

// Importamos las funciones encargadas de comunicarse con el servidor/backend
import { getClientesApi, saveClienteApi, eliminarClienteApi } from '../services/clientesApi';
import { getEquiposInitData } from '../services/equiposApi';

// Importamos el componente de la ventana emergente (modal)
import { ClienteModal } from '../components/modals/ClienteModal';

// Importamos el Hook personalizado de autenticación
import { useAuth } from '../context/AuthContext';

export function Clientes() {
  // ==========================================
  // DECLARACIÓN DE ESTADOS Y CONFIGURACIÓN
  // ==========================================
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient(); // Nos permite manipular e invalidar la caché manualmente

  const [selectedEstado] = useState<string>(searchParams.get('estado') || 'todos');
  const [selectedTipo] = useState<string>(searchParams.get('tipo') || 'todos');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // ==========================================
  // CACHÉ Y API CON TANSTACK QUERY
  // ==========================================

  // 1. Consulta maestra: Trae clientes y equipos en paralelo compartiendo estados de carga
  const { 
    data: masterData, 
    isLoading: loadingMaster, 
    isError: errorMaster 
  } = useQuery({
    queryKey: ['clientesMasterData'],
    queryFn: async () => {
      const [clientesData, equiposData] = await Promise.all([
        getClientesApi(),
        getEquiposInitData()
      ]);
      return {
        clientes: Array.isArray(clientesData) ? clientesData : [],
        equipos: equiposData && Array.isArray(equiposData.equipos) ? equiposData.equipos : []
      };
    }
  });

  // Extraemos de la consulta con valores por defecto seguros
  const clientes = masterData?.clientes || [];
  const equipos = masterData?.equipos || [];

  // 2. Consulta geográfica: Trae el catálogo de estados y ciudades
  const { data: geoData } = useQuery({
    queryKey: ['catalogUbicaciones'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/clientes/ubicaciones`);
      if (!response.ok) throw new Error('Error al conectar catálogo geográfico');
      const data = await response.json();
      return {
        catalog: data,
        estados: Object.keys(data)
      };
    }
  });

  const catalogUbicaciones = geoData?.catalog || {};
  const listaEstados = geoData?.estados || [];

  // ==========================================
  // LÓGICA DE FILTRADO (BÚSQUEDA EN TIEMPO REAL)
  // ==========================================
  const filteredClientes = useMemo(() => {
    let result = [...clientes];

    // 1. Filtrado de la URL: Estado
    if (selectedEstado !== 'todos') {
      result = result.filter(cliente => cliente.estado === selectedEstado);
    }

    // 2. Filtrado de la URL: Tipo de Equipo
    if (selectedTipo !== 'todos') {
      const equiposFiltradosPorTipo = equipos.filter(e => String(e.tipoEquipoId) === String(selectedTipo));
      const clientesConEseTipo = new Set(equiposFiltradosPorTipo.map(e => String(e.clienteId)));
      result = result.filter(cliente => clientesConEseTipo.has(String(cliente.id)));
    }

    // 3. Filtro de la barra de búsqueda por texto
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((cliente) => {
        return (
          (cliente.razonSocial || '').toLowerCase().includes(query) ||
          (cliente.rifDni || '').toLowerCase().includes(query) ||
          (cliente.contacto || '').toLowerCase().includes(query) ||
          (cliente.estado || '').toLowerCase().includes(query) ||
          (cliente.ciudad || '').toLowerCase().includes(query) ||
          (cliente.direccion || '').toLowerCase().includes(query) ||
          (cliente.numeroTelefonico || '').toLowerCase().includes(query) ||
          (cliente.correoElectronico || '').toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [clientes, equipos, selectedEstado, selectedTipo, searchQuery]);

  // ==========================================
  // MANEJADORES DE EVENTOS
  // ==========================================
  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreateCliente = () => {
    setSelectedCliente(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleSaveCliente = async (clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'>) => {
    try {
      await saveClienteApi(clienteData, isCreating);
      
      // ¡ESTA ES LA MAGIA OOFFLINE/CACHE!: Le decimos a TanStack Query que limpie los datos viejos
      // Esto fuerza a la app a pedir datos nuevos a la API en segundo plano sin reiniciar la UI
      queryClient.invalidateQueries({ queryKey: ['clientesMasterData'] });
      
      setIsModalOpen(false); 
    } catch (error) {
      console.error('Error al intentar guardar:', error);
      alert(error instanceof Error ? error.message : 'No se pudo guardar el registro.');
    }
  };

  const handleDeleteCliente = async (id: number) => {
    if (!window.confirm('¿Estás segura de que deseas eliminar este cliente de forma permanente?')) {
      return;
    }

    try {
      await eliminarClienteApi(id.toString());
      
      // Invalidamos la caché para actualizar instantáneamente la pantalla
      queryClient.invalidateQueries({ queryKey: ['clientesMasterData'] });
      
      setIsModalOpen(false); 
    } catch (error) {
      console.error('Error al intentar eliminar:', error);
      alert(error instanceof Error ? error.message : 'Error de red al intentar eliminar el registro.');
    }
  };

  // ==========================================
  // RENDERIZACIÓN CONDICIONAL (MANEJO DE RED)
  // ==========================================
  if (loadingMaster) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066CC]"></div>
        <p className="text-sm text-gray-100">Sincronizando clientes registrados...</p>
      </div>
    );
  }

  if (errorMaster) {
    return (
      <div className="max-w-md mx-auto my-10 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
        <p className="font-semibold">Error de conexión local</p>
        <p className="text-xs mt-1">No se pudo recuperar la información maestra del servidor PostgreSQL.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECCIÓN A: CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-100 mt-1">
            {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} registrado{filteredClientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleCreateCliente}
            className="bg-[#FF6B35] hover:bg-[#E5582C] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Cliente
          </Button>
        )}
      </div>

      {/* SECCIÓN B: BARRA DE BÚSQUEDA */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por razón social, RIF, contacto, estado o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN C: REJILLA DE CLIENTES */}
      {filteredClientes.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron clientes</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza registrando tu primer cliente'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <Card
              key={cliente.id}
              className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleClienteClick(cliente)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <Badge
                    variant={cliente.equiposRegistrados > 0 ? 'default' : 'secondary'}
                    className={cliente.equiposRegistrados > 0 ? 'bg-[#FF6B35] hover:bg-[#E5582C]' : ''}
                  >
                    {cliente.equiposRegistrados} equipo{cliente.equiposRegistrados !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
                  {cliente.razonSocial}
                </h3>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{cliente.estado}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{cliente.numeroTelefonico}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{cliente.correoElectronico}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">RIF:</span> {cliente.rifDni}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Contacto:</span> {cliente.contacto}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SECCIÓN D: VENTANA MODAL */}
      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={selectedCliente}
        isCreating={isCreating}
        onSave={handleSaveCliente}
        onDelete={handleDeleteCliente}
        allClientes={clientes}
        catalogUbicaciones={catalogUbicaciones}
        listaEstados={listaEstados}
      />
    </div>
  );
}