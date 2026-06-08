import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Truck, Search, Plus, Package } from 'lucide-react';
import {
  type Cliente,
  type Equipo,
  type Marca,
  type Modelo,
  type TipoEquipo,
} from '../data/mockData';
import { EquipoModal } from '../components/modals/EquipoModal';
import { useAuth } from '../context/AuthContext';

export function Equipos() {
  const { isAdmin } = useAuth();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [marcasList, setMarcasList] = useState<Marca[]>([]);
  const [modelosList, setModelosList] = useState<Modelo[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [soloConEquipos, setSoloConEquipos] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [equiposData, clientesData, marcasData, modelosData, tiposData] = await Promise.all([
          getEquipos(),
          getClientes(),
          getMarcas(),
          getModelos(),
          getTiposEquipo(),
        ]);

        setEquipos(equiposData);
        setClientesList(clientesData);
        setMarcasList(marcasData);
        setModelosList(modelosData);
        setTiposEquipo(tiposData);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos de equipos.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const clientesConEquipos = useMemo(() => {
    const cliente = new Set(equipos.map(e => e.clienteId));
    return clientesList.filter(c => soloConEquipos ? clienteIds.has(c.id) : true);
  }, [soloConEquipos, equipos, clientesList]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const filtered = clientesConEquipos.map(cliente => {
      const clienteEquipos = equipos.filter(e => e.clienteId === cliente.id);
      
      if (!searchQuery) {
        return { cliente, equipos: clienteEquipos };
      }

      const matchingEquipos = clienteEquipos.filter(equipo => {
        const marca = marcasList.find(m => m.id === equipo.marcaId);
        const modelo = modelosList.find(m => m.id === equipo.modeloId);
        const tipo = tiposEquipo.find(t => t.id === equipo.tipoEquipoId);

        return (
          equipo.aliasInterno.toLowerCase().includes(query) ||
          equipo.serial.toLowerCase().includes(query) ||
          equipo.observacion.toLowerCase().includes(query) ||
          marca?.nombre.toLowerCase().includes(query) ||
          modelo?.nombre.toLowerCase().includes(query) ||
          tipo?.nombre.toLowerCase().includes(query) ||
          cliente.razonSocial.toLowerCase().includes(query)
        );
      });

      return { cliente, equipos: matchingEquipos };
    }).filter(item => item.equipos.length > 0);

    return filtered;
  }, [clientesConEquipos, equipos, searchQuery, marcasList, modelosList]);

  const groupedByTipo = useMemo(() => {
    return filteredData.map(({ cliente, equipos: clienteEquipos }) => {
      const grouped = tiposEquipo.map(tipo => ({
        tipo,
        equipos: clienteEquipos.filter(e => e.tipoEquipoId === tipo.id),
      })).filter(g => g.equipos.length > 0);

      return { cliente, grupos: grouped };
    });
  }, [filteredData]);

  const handleEquipoClick = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreateEquipo = () => {
    setSelectedEquipo(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleSaveEquipo = (equipoData: Omit<Equipo, 'id'>) => {
    if (selectedEquipo) {
      setEquipos(prev =>
        prev.map(e => (e.id === selectedEquipo.id ? { ...e, ...equipoData } : e))
      );
    } else {
      const newEquipo: Equipo = {
        ...equipoData,
        id: Date.now().toString(),
      };
      setEquipos(prev => [newEquipo, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteEquipo = (id: string) => {
    setEquipos(prev => prev.filter(e => e.id !== id));
    setIsModalOpen(false);
  };

  const handleAddMarca = (marca: Marca) => {
    setMarcasList(prev => [...prev, marca]);
  };

  const handleAddModelo = (modelo: Modelo) => {
    setModelosList(prev => [...prev, modelo]);
  };

  const totalEquipos = equipos.length;

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-600">Cargando equipos...</div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reporte de Equipos</h2>
          <p className="text-gray-600 mt-1">
            {totalEquipos} equipo{totalEquipos !== 1 ? 's' : ''} registrado{totalEquipos !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleCreateEquipo}
            className="bg-[#FF6B35] hover:bg-[#E5582C] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Equipo
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por alias, serial, marca, modelo, tipo o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="solo-con-equipos"
              checked={soloConEquipos}
              onCheckedChange={setSoloConEquipos}
            />
            <Label htmlFor="solo-con-equipos" className="cursor-pointer">
              Mostrar solo clientes con equipos registrados
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Listado de Equipos */}
      {groupedByTipo.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron equipos
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza registrando tu primer equipo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByTipo.map(({ cliente, grupos }) => (
            <Card key={cliente.id}>
              <CardHeader className="bg-gradient-to-r from-[#0066CC]/5 to-transparent">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{cliente.razonSocial}</span>
                  <Badge variant="secondary">
                    {grupos.reduce((acc, g) => acc + g.equipos.length, 0)} equipo(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {grupos.map(({ tipo, equipos: tipoEquipos }) => (
                    <div key={tipo.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-[#FF6B35]" />
                        <h4 className="font-semibold text-gray-900">{tipo.nombre}</h4>
                        <Badge className="bg-[#FF6B35] hover:bg-[#E5582C]">
                          {tipoEquipos.length}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tipoEquipos.map(equipo => {
                          const marca = marcasList.find(m => m.id === equipo.marcaId);
                          const modelo = modelosList.find(m => m.id === equipo.modeloId);

                          return (
                            <Card
                              key={equipo.id}
                              className="hover:shadow-md transition-all cursor-pointer hover:border-[#0066CC]"
                              onClick={() => handleEquipoClick(equipo)}
                            >
                              <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                      {equipo.aliasInterno}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {marca?.nombre} - {modelo?.nombre}
                                    </p>
                                  </div>
                                  <Truck className="w-5 h-5 text-[#0066CC] flex-shrink-0" />
                                </div>
                                <p className="text-xs text-gray-500 font-mono">
                                  S/N: {equipo.serial}
                                </p>
                                {equipo.observacion && (
                                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                    {equipo.observacion}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Equipo Modal */}
      <EquipoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        equipo={selectedEquipo}
        isCreating={isCreating}
        onSave={handleSaveEquipo}
        onDelete={handleDeleteEquipo}
        allEquipos={equipos}
        clientes={clientesList}
        tiposEquipo={tiposEquipo}
        marcasList={marcasList}
        modelosList={modelosList}
        onAddMarca={handleAddMarca}
        onAddModelo={handleAddModelo}
      />
    </div>
  );
}
