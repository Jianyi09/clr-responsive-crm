import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Truck, Search, Plus, Package, Wrench, Info } from 'lucide-react';
import {
  type Equipo,
  type Modelo,
  type Marca,
  type RepuestoModelo,
  type Repuesto,
} from '../data/mockData';
import { EquipoModal } from '../components/modals/EquipoModal';
import { RepuestosModal } from '../components/modals/RepuestosModal';
import { useAuth } from '../context/AuthContext';
import { getEquiposInitData, saveEquipoApi, eliminarEquipoApi } from '../services/equiposApi';
import { saveModeloApi, getModelosApi } from '../services/modelosApi';
import { saveMarcaApi } from '../services/marcasApi';

export function Equipos() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const selectedEstado = searchParams.get('estado') || 'todos';
  const selectedTipo = searchParams.get('tipo') || 'todos';
  
  // Estados de filtros y UI locales
  const [searchQuery, setSearchQuery] = useState('');
  const [soloConEquipos] = useState(false);

  // Estados del Modal Principal del Equipo
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados del Nuevo Modal de Repuestos 
  const [repuestosEquipo, setRepuestosEquipo] = useState<Equipo | null>(null);
  const [isRepuestosModalOpen, setIsRepuestosModalOpen] = useState(false);

  // ==========================================
  // ADAPTACIÓN AL MOTOR DE CACHÉ DE TANSTACK QUERY
  // ==========================================
  const { 
    data: masterData, 
    isLoading, 
    isError 
  } = useQuery({
    // La caché reacciona y se invalida automáticamente si cambian los parámetros de la URL
    queryKey: ['equiposMasterData', selectedEstado, selectedTipo],
    queryFn: async () => {
      const [dashboardData, modelosData] = await Promise.all([
        getEquiposInitData({
          estado: selectedEstado,
          tipoEquipo: selectedTipo
        }),
        getModelosApi()
      ]);

      return {
        equipos: dashboardData.equipos || [],
        clientesList: dashboardData.clientes || [],
        marcasList: dashboardData.marcas || [],
        tiposEquipo: dashboardData.tiposEquipo || [],
        modelosList: modelosData.modelos || [],
        repuestosState: modelosData.links || [],
        listaRepuestos: modelosData.repuestos || []
      };
    }
  });

  // Variables seguras de respaldo para la UI
  const equipos = masterData?.equipos || [];
  const clientesList = masterData?.clientesList || [];
  const marcasList = masterData?.marcasList || [];
  const tiposEquipo = masterData?.tiposEquipo || [];
  const modelosList = masterData?.modelosList || [];
  const repuestosState = masterData?.repuestosState || [];
  const listaRepuestos = masterData?.listaRepuestos || [];

  // ==========================================
  // FILTRADO Y PROCESAMIENTO INTERNO (MEMO)
  // ==========================================
  const clientesConEquipos = useMemo(() => {
    if (soloConEquipos) {
      const clienteIds = new Set(equipos.map(e => e.clienteId));
      return clientesList.filter(c => clienteIds.has(c.id));
    }
    return clientesList;
  }, [soloConEquipos, equipos, clientesList]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return clientesConEquipos.map(cliente => {
      let clienteEquipos = equipos.filter(e => e.clienteId === cliente.id);

      if (selectedTipo !== 'todos') {
        clienteEquipos = clienteEquipos.filter(e => String(e.tipoEquipoId) === String(selectedTipo));
      }

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
          marca?.marcaNombre.toLowerCase().includes(query) ||
          modelo?.nombre.toLowerCase().includes(query) ||
          tipo?.tipoNombre.toLowerCase().includes(query) ||
          cliente.razonSocial.toLowerCase().includes(query)
        );
      });
      return { cliente, equipos: matchingEquipos };
    }).filter(item => item.equipos.length > 0);
  }, [clientesConEquipos, equipos, searchQuery, marcasList, modelosList, tiposEquipo, selectedTipo]);

  const groupedByTipo = useMemo(() => {
    return filteredData.map(({ cliente, equipos: clienteEquipos }) => {
      const grouped = tiposEquipo.map(tipo => ({
        tipo,
        equipos: clienteEquipos.filter(e => e.tipoEquipoId === tipo.id),
      })).filter(g => g.equipos.length > 0);

      return { cliente, grupos: grouped };
    });
  }, [filteredData, tiposEquipo]);

  const totalEquipos = useMemo(() => {
    return filteredData.reduce((acc, item) => acc + item.equipos.length, 0);
  }, [filteredData]);

  const modeloForRepuestos = repuestosEquipo
    ? modelosList.find(m => m.id === repuestosEquipo.modeloId) ?? null
    : null;

  const getRepuestosCount = (modeloId: string) =>
    repuestosState.filter(rm => String(rm.modeloId) === String(modeloId)).length;

  // ==========================================
  // MANEJADORES DE APERTURA DE MODALES
  // ==========================================
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

  // ==========================================
  // PROCESAMIENTOS DE MUTACIONES AL BACKEND
  // ==========================================
  const handleSaveEquipo = async (equipoData: Omit<Equipo, 'id'>) => {
    try {
      const idParaApi = selectedEquipo ? selectedEquipo.id : undefined;
      await saveEquipoApi(equipoData, idParaApi);
      
      // Invalidamos las queries para forzar la recarga limpia de TanStack
      queryClient.invalidateQueries({ queryKey: ['equiposMasterData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMasterData'] });
      
      setIsEquipoModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error al guardar el equipo en el servidor');
    }
  };

  const handleDeleteEquipo = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este equipo permanentemente?')) {
      return;
    }
    try {
      await eliminarEquipoApi(id);
      queryClient.invalidateQueries({ queryKey: ['equiposMasterData'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardMasterData'] });
      setIsEquipoModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el equipo del servidor');
    }
  };

  const handleAddModeloAsync = async (modeloData: Omit<Modelo, 'id'>): Promise<Modelo> => {
    try {
      const idGenerado = await saveModeloApi(modeloData);
      const nuevoModelo: Modelo = { ...modeloData, id: idGenerado };
      
      // Sincronizamos la caché global
      queryClient.invalidateQueries({ queryKey: ['equiposMasterData'] });
      return nuevoModelo;
    } catch (err) {
      console.error(err);
      throw new Error(err instanceof Error ? err.message : 'Error al guardar el modelo rápido en el servidor');
    }
  };

  const handleAddMarcaAsync = async (marcaNombre: string): Promise<Marca> => {
    try {
      const nuevaMarca = await saveMarcaApi(marcaNombre);
      queryClient.invalidateQueries({ queryKey: ['equiposMasterData'] });
      return nuevaMarca;
    } catch (err) {
      console.error('Error al registrar la marca express:', err);
      throw new Error(err instanceof Error ? err.message : 'No se pudo pre-registrar la marca.');
    }
  };

  // No-ops para el modal de repuestos (solo lectura en esta vista)
  const handleAddRepuesto = (_newLink: RepuestoModelo) => {};
  const handleAddNewRepuesto = (_repuesto: Repuesto, _link: RepuestoModelo) => {};

  // ==========================================
  // MANEJO DE ESTADOS DE LA RED
  // ==========================================
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0066CC]"></div>
        <p className="text-sm text-gray-100">Cargando equipos en tiempo real...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-md mx-auto my-10 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
        No se pudieron cargar los datos de los equipos reales.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Reporte de Equipos</h2>
          <p className="text-gray-100 mt-1">
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
              placeholder="Buscar por serial, marca, modelo, tipo o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                        <h4 className="font-semibold text-gray-900">{tipo.tipoNombre}</h4>
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
                                      {marca?.marcaNombre} - {modelo?.nombre}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 font-mono mb-2">
                                  S/N: {equipo.serial}
                                </p>
                                {equipo.observacion && (
                                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                    {equipo.observacion}
                                  </p>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs h-7 border-[#0066CC]/40 text-[#0066CC] hover:bg-[#0066CC]/5"
                                    onClick={() => handleOpenRepuestosModal(equipo)}
                                  >
                                    <Wrench className="w-3 h-3 mr-1" />
                                    Repuestos
                                    {equipo.modeloId && getRepuestosCount(equipo.modeloId) > 0 && (
                                      <span className="ml-1.5 bg-[#0066CC] text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center leading-none font-sans font-medium">
                                        {getRepuestosCount(equipo.modeloId)}
                                      </span>
                                    )}
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
        onAddMarcaAsync={handleAddMarcaAsync}
        onAddModeloAsync={handleAddModeloAsync}
      />

      {/* Modal de Repuestos */}
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