import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Users, Truck, Box, TrendingUp, Building2, MapPin } from 'lucide-react';
import { Cliente, Equipo, Modelo, TipoEquipo, ESTADOS } from '../data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getClientesApi } from '../services/clientesApi';
import { getEquiposInitData } from '../services/equiposApi';
import { getModelosApi } from '../services/modelosApi';

export function Dashboard() {
  const [selectedEstado, setSelectedEstado] = useState<string>('todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [clientesData, equiposData, modelosData] = await Promise.all([
          getClientesApi(),
          getEquiposInitData(),
          getModelosApi(),
        ]);

        setClientes(clientesData || []);
        setEquipos(equiposData.equipos || []);
        setModelos(modelosData.modelos || []);
        setTiposEquipo(modelosData.tiposEquipo || []);

      } catch (err) {
        console.error("Error al poblar el Dashboard Real:", err);
        setError('No se pudo cargar los datos en tiempo real del servidor.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 1. Primero calculamos los equipos filtrados por tipo
const filteredEquipos = useMemo(() => {
  let filtered = [...equipos];
  if (selectedTipo !== 'todos') {
    filtered = filtered.filter(e => String(e.tipoEquipoId) === String(selectedTipo));
  }
  return filtered;
}, [selectedTipo, equipos]);

// 2. Usamos los equipos para restringir la lista de clientes si hay un tipo seleccionado
const filteredClientes = useMemo(() => {
  let filtered = [...clientes];

  // Filtro por Estado (el que ya tenías)
  if (selectedEstado !== 'todos') {
    filtered = filtered.filter(c => c.estado === selectedEstado);
  }
  if (selectedTipo !== 'todos') {
    // Obtenemos un Set con todos los clienteId únicos que poseen el tipo de equipo seleccionado
    const clientesConEseTipo = new Set(
      filteredEquipos.map(equipo => String(equipo.clienteId))
    );
    
    filtered = filtered.filter(c => clientesConEseTipo.has(String(c.id)));
  }
  return filtered;
}, [selectedEstado, selectedTipo, clientes, filteredEquipos]);

  const stats = [
    {
      title: 'Total Clientes',
      value: filteredClientes.length,
      icon: Users,
      color: 'text-[#0066CC]',
      bgColor: 'bg-[#0066CC]/10',
      link: '/clientes',
    },
    {
      title: 'Total Equipos',
      value: filteredEquipos.length,
      icon: Truck,
      color: 'text-[#FF6B35]',
      bgColor: 'bg-[#FF6B35]/10',
      link: '/equipos',
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

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-600">Cargando dashboard...</div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-red-600">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Vista general del sistema de gestión de flota</p>
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
                  {ESTADOS.map(estado => (
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
              <Link key={cliente.id} to="/clientes">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-[#0066CC]/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#0066CC]" />
                      </div>
                      <Badge variant={cliente.equiposRegistrados > 0 ? 'default' : 'secondary'}>
                        {cliente.equiposRegistrados} equipos
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
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
