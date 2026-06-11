import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Truck, Search, Plus, Package, Wrench, Info } from 'lucide-react';
import {
  type Cliente,
  type Equipo,
  type Marca,
  type Modelo,
  type TipoEquipo,
  type RepuestoModelo,
  type Repuesto,
} from '../data/mockData';
import { EquipoModal } from '../components/modals/EquipoModal';
import { RepuestosModal } from '../components/modals/RepuestosModal';
import { useAuth } from '../context/AuthContext';
import { getEquiposInitData, saveEquipoApi, eliminarEquipoApi } from '../services/equiposApi';

export function Equipos() {
  const { isAdmin } = useAuth();
  
  // Estados de datos reales de la Base de Datos
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [clientesList, setClientesList] = useState<Cliente[]>([]);
  const [marcasList, setMarcasList] = useState<Marca[]>([]);
  const [modelosList, setModelosList] = useState<Modelo[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  
  // Estados agregados por Figma para la gestión visual de repuestos (Mock temporales)
  const [repuestosState, setRepuestosState] = useState<RepuestoModelo[]>([]);
  const [listaRepuestos, setListaRepuestos] = useState<Repuesto[]>([]);

  // Estados de filtros y UI
  const [searchQuery, setSearchQuery] = useState('');
  const [soloConEquipos, setSoloConEquipos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados del Modal Principal del Equipo
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados del Nuevo Modal de Repuestos (Lectura en esta pestaña)
  const [repuestosEquipo, setRepuestosEquipo] = useState<Equipo | null>(null);
  const [isRepuestosModalOpen, setIsRepuestosModalOpen] = useState(false);

  // Carga inicial conectada al Puente Backend-Frontend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dashboardData = await getEquiposInitData();

        setEquipos(dashboardData.equipos);
        setClientesList(dashboardData.clientes);
        setMarcasList(dashboardData.marcas);
        setModelosList(dashboardData.modelos);
        setTiposEquipo(dashboardData.tiposEquipo);
        
        // Inicializadores de repuestos si tu backend los incluye en el futuro
        // Por ahora los dejamos vacíos o mapeados si vienen en el payload
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos de los equipos reales.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filtrado de clientes estructurado
  const clientesConEquipos = useMemo(() => {
    const clienteIds = new Set(equipos.map(e => e.clienteId));
    return clientesList.filter(c => soloConEquipos ? clienteIds.has(c.id) : true);
  }, [soloConEquipos, equipos, clientesList]);

  // Buscador inteligente unificado de Figma
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

  // Agrupación por Tipo de Equipo
  const groupedByTipo = useMemo(() => {
    return filteredData.map(({ cliente, equipos: clienteEquipos }) => {
      const grouped = tiposEquipo.map(tipo => ({
        tipo,
        equipos: clienteEquipos.filter(e => e.tipoEquipoId === tipo.id),
      })).filter(g => g.equipos.length > 0);

      return { cliente, grupos: grouped };
    });
  }, [filteredData, tiposEquipo]);

  // Controladores de apertura de Modales
  const handleOpenEquipoModal = (equipo: Equipo) => {
    setSelectedEquipo(equipo);
    setIsCreating(false);
    setIsEquipoModalOpen(true);
  };

  const handleOpenRepuestosModal = (equipo: Equipo) => {
    setRepuestosEquipo(equipo);
    setIsRepuestosModalOpen(true);
  };

  const handleCreateEquipo = () => {
    setSelectedEquipo(null);
    setIsCreating(true);
    setIsEquipoModalOpen(true);
  };

  // Lógica Asíncrona del Puente al Backend (Guardar / Registrar)
  const handleSaveEquipo = async (equipoData: Omit<Equipo, 'id'>) => {
    try {
      const idParaApi = selectedEquipo ? selectedEquipo.id : undefined;
      const idGenerado = await saveEquipoApi(equipoData, idParaApi);

      if (selectedEquipo) {
        setEquipos(prev =>
          prev.map(e => (e.id === selectedEquipo.id ? { ...e, ...equipoData } : e))
        );
      } else {
        const newEquipo: Equipo = {
          ...equipoData,
          id: idGenerado,
        };
        setEquipos(prev => [newEquipo, ...prev]);
      }
      setIsEquipoModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error al guardar el equipo en el servidor');
    }
  };

  // Lógica Asíncrona del Puente al Backend (Eliminar)
  const handleDeleteEquipo = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este equipo permanentemente?')) {
      return;
    }

    try {
      await eliminarEquipoApi(id);
      setEquipos(prev => prev.filter(e => e.id !== id));
      setIsEquipoModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el equipo del servidor');
    }
  };

  const handleAddMarca = (marca: Marca) => {
    setMarcasList(prev => [...prev, marca]);
  };

  const handleAddModelo = (modelo: Modelo) => {
    setModelosList(prev => [...prev, modelo]);
  };

  // Manejadores No-Op requeridos por el modal de repuestos (ya que es de solo lectura aquí)
  const handleAddRepuesto = (newLink: RepuestoModelo) => {
    setRepuestosState(prev => [...prev, newLink]);
  };
  const handleAddNewRepuesto = (_repuesto: Repuesto, _link: RepuestoModelo) => {};

  const totalEquipos = equipos.length;

  // Busca el modelo asociado al equipo activo en el modal de repuestos
  const modeloForRepuestos = repuestosEquipo
    ? modelosList.find(m => m.id === repuestosEquipo.modeloId) ?? null
    : null;

  if (loading) {
    return <div className="py-10 text-center text-gray-600">Cargando la flota de equipos reales...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
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
                              className="hover:shadow-md transition-all hover:border-[#0066CC]/40"
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
                                <p className="text-xs text-gray-500 font-mono mb-2">
                                  S/N: {equipo.serial}
                                </p>
                                {equipo.observacion && (
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                    {equipo.observacion}
                                  </p>
                                )}

                                {/* Botones de Acción de Figma Restablecidos */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs h-7 border-[#0066CC]/40 text-[#0066CC] hover:bg-[#0066CC]/5"
                                    onClick={() => handleOpenRepuestosModal(equipo)}
                                  >
                                    <Wrench className="w-3 h-3 mr-1" />
                                    Repuestos
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="flex-1 text-xs h-7 bg-[#0066CC] hover:bg-[#0052A3] text-white"
                                    onClick={() => handleOpenEquipoModal(equipo)}
                                  >
                                    <Info className="w-3 h-3 mr-1" />
                                    Equipo
                                  </Button>
                                </div>
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

      {/* Modal Detalle/Edición Equipo Real */}
      <EquipoModal
        isOpen={isEquipoModalOpen}
        onClose={() => setIsEquipoModalOpen(false)}
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

      {/* Modal de Repuestos Inyectado de Figma (Solo Lectura en Equipos) */}
      <RepuestosModal
        isOpen={isRepuestosModalOpen}
        onClose={() => setIsRepuestosModalOpen(false)}
        modelo={modeloForRepuestos}
        canAdd={false}
        listaRepuestosState={listaRepuestos}
        repuestosState={repuestosState}
        onAddRepuesto={handleAddRepuesto}
        onAddNewRepuesto={handleAddNewRepuesto}
      />
    </div>
  );
}