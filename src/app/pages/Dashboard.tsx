import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, Truck, Box, TrendingUp, Building2, MapPin } from 'lucide-react';
import { type Cliente, type Equipo } from '../data/mockData'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getClientesApi, getEstadosApi } from '../services/clientesApi';
import { getEquiposInitData } from '../services/equiposApi';
import { getModelosApi } from '../services/modelosApi';
import { ClienteModal } from '../components/modals/ClienteModal';

export function Dashboard() {
  // ==========================================
  // CONFIGURACIÓN DE FILTROS PERSISTENTES
  // ==========================================
  const [selectedEstado, setSelectedEstado] = useState<string>(() => {
    return sessionStorage.getItem('dashboard_selectedEstado') || 'todos';
  });
  
  const [selectedTipo, setSelectedTipo] = useState<string>(() => {
    return sessionStorage.getItem('dashboard_selectedTipo') || 'todos';
  });

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Guardamos las selecciones en el sessionStorage para no perder los filtros al navegar
  useEffect(() => {
    sessionStorage.setItem('dashboard_selectedEstado', selectedEstado);
  }, [selectedEstado]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_selectedTipo', selectedTipo);
  }, [selectedTipo]);

  // ==========================================
  // CACHÉ Y CONSULTA INTEGRADA (TANSTACK QUERY)
  // ==========================================
  const { 
    data: dashData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['dashboardMasterData'],
    queryFn: async () => {
      const [clientesData, equiposData, modelosData, estadosData] = await Promise.all([
        getClientesApi(),
        getEquiposInitData(),
        getModelosApi(),
        getEstadosApi(), 
      ]);

      return {
        clientes: clientesData || [],
        equipos: equiposData.equipos || [],
        modelos: modelosData.modelos || [],
        tiposEquipo: modelosData.tiposEquipo || [],
        estadosDb: estadosData || []
      };
    }
  });

  // Valores de respaldo seguros por si la API o la caché se están rehidratando
  const clientes = dashData?.clientes || [];
  const equipos = dashData?.equipos || [];
  const modelos = dashData?.modelos || [];
  const tiposEquipo = dashData?.tiposEquipo || [];
  const estadosDb = dashData?.estadosDb || [];

  // ==========================================
  // ACCIONES CON MODALES
  // ==========================================
  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsModalOpen(true);
  };  

  // ==========================================
  // LÓGICA DE FILTRADOS EFICIENTES (MEMOIZACIÓN)
  // ==========================================
  const filteredEquipos = useMemo(() => {
    let filtered = [...equipos];
    if (selectedTipo !== 'todos') {
      filtered = filtered.filter(e => String(e.tipoEquipoId) === String(selectedTipo));
    }

    if (selectedEstado !== 'todos') {
      const clientesDelEstado = new Set(
        clientes.filter(c => c.estado === selectedEstado).map(c => String(c.id))
      );
      filtered = filtered.filter(e => clientesDelEstado.has(String(e.clienteId)));
    }

    return filtered;
  }, [selectedTipo, selectedEstado, equipos, clientes]);

  const filteredClientes = useMemo(() => {
    let filtered = [...clientes];

    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(c => c.estado === selectedEstado);
    }
    if (selectedTipo !== 'todos') {
      const clientesConEseTipo = new Set(
        filteredEquipos.map(equipo => String(equipo.clienteId))
      );
      filtered = filtered.filter(c => clientesConEseTipo.has(String(c.id)));
    }
    return filtered;
  }, [selectedEstado, selectedTipo, clientes, filteredEquipos]);

  // Constante de estadísticas para iterar en la UI
  const stats = [
    {
      title: 'Total Clientes',
      value: filteredClientes.length,
      icon: Users,
      color: 'text-[#0066CC]',
      bgColor: 'bg-[#0066CC]/10',
      link: `/clientes?estado=${encodeURIComponent(selectedEstado)}&tipo=${encodeURIComponent(selectedTipo)}`,
    },
    {
      title: 'Total Equipos',
      value: filteredEquipos.length,
      icon: Truck,
      color: 'text-[#FF6B35]',
      bgColor: 'bg-[#FF6B35]/10',
      link: `/equipos?estado=${encodeURIComponent(selectedEstado)}&tipo=${encodeURIComponent(selectedTipo)}`,
    },
    {
      title: 'Modelos Registrados',
      value: modelos.length,
      icon: Box,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/modelos',
    },
    {
      title: 'Tipos de Equipo',
      value: tiposEquipo.length,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/equipos',
    },
  ];

  // ==========================================
  // MANEJO DE ESTADOS DE LA RED
  // ==========================================
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066CC]"></div>
        <p className="text-sm text-gray-100">Cargando métricas en tiempo real...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto my-10 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
        <p className="font-semibold">Error de sincronización</p>
        <p className="text-xs mt-1">No se pudieron recargar las analíticas de la flota local.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-100 mt-1">Vista general del sistema de gestión de flota</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link}>
            <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra la información del dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {estadosDb.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Equipo</label>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {tiposEquipo.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>{tipo.tipoNombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedEstado !== 'todos' || selectedTipo !== 'todos') && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedEstado('todos');
                    setSelectedTipo('todos');
                    sessionStorage.removeItem('dashboard_selectedEstado');
                    sessionStorage.removeItem('dashboard_selectedTipo');
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clientes Destacados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clientes Recientes</CardTitle>
              <CardDescription>Últimos clientes registrados en el sistema</CardDescription>
            </div>
            <Link to="/clientes">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClientes.slice(0, 6).map((cliente) => (
              <div 
                key={cliente.id} 
                onClick={() => handleClienteClick(cliente)}
                className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md rounded-xl"
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-[#0066CC]/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#0066CC]" />
                      </div>
                      <Badge variant={cliente.equiposRegistrados > 0 ? 'default' : 'secondary'}>
                        {cliente.equiposRegistrados} equipo{cliente.equiposRegistrados !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {cliente.razonSocial}
                    </h4>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="line-clamp-1">{cliente.estado} - {cliente.ciudad}</span>
                      </div>
                      <p className="line-clamp-1">{cliente.contacto}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ClienteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cliente={selectedCliente}
        isCreating={false} 
        onSave={async () => {}} 
        onDelete={async () => {}} 
        allClientes={clientes}
        catalogUbicaciones={{}} 
        listaEstados={estadosDb}
      />
    </div>
  );
}

