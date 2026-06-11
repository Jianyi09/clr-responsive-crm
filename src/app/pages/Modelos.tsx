import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Box, Search, Plus, Package, Wrench, Info } from 'lucide-react';
import {
  type Marca,
  type Modelo,
  type TipoEquipo,
  // Nota: Asegúrate de definir o importar estos tipos según correspondan a tus entidades
  type Repuesto,
  type RepuestoModelo,
} from '../data/mockData'; 
import { ModeloModal } from '../components/modals/ModeloModal';
import { RepuestosModal } from '../components/modals/RepuestosModal'; // Importación del nuevo modal
import { useAuth } from '../context/AuthContext';
// Aquí importarás tus funciones de endpoints reales del API de modelos y repuestos cuando los crees:
// import { getModelos, getMarcas, getTiposEquipo, getRepuestos, getRepuestosModelos } from '../api/endpoints';

export function Modelos() {
  const { isAdmin } = useAuth();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcasList, setMarcasList] = useState<Marca[]>([]);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  
  // Nuevos estados para soportar la funcionalidad de repuestos de Figma
  const [repuestosState, setRepuestosState] = useState<RepuestoModelo[]>([]);
  const [listaRepuestosState, setListaRepuestosState] = useState<Repuesto[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de control para Modelo Detail Modal
  const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Estados de control para Repuestos Modal
  const [repuestosModelo, setRepuestosModelo] = useState<Modelo | null>(null);
  const [isRepuestosModalOpen, setIsRepuestosModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Integraremos las consultas de repuestos junto con la carga inicial
        // Reemplaza con tus promesas de endpoints reales cuando estén listas
        const [modelosData, marcasData, tiposData] = await Promise.all([
          getModelos(),
          getMarcas(),
          getTiposEquipo(),
          // getRepuestos(), 
          // getRepuestosModelos()
        ]);

        setModelos(modelosData);
        setMarcasList(marcasData);
        setTiposEquipo(tipsData);
        // setListaRepuestosState(repuestosData);
        // setRepuestosState(relacionesData);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los datos de modelos y componentes.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredModelos = useMemo(() => {
    if (!searchQuery) return modelos;

    const query = searchQuery.toLowerCase();
    return modelos.filter(modelo => {
      const marca = marcasList.find(m => m.id === modelo.marcaId);
      const tipo = tiposEquipo.find(t => t.id === modelo.tipoEquipoId);

      return (
        modelo.nombre.toLowerCase().includes(query) ||
        marca?.nombre.toLowerCase().includes(query) ||
        tipo?.nombre.toLowerCase().includes(query) ||
        modelo.anoVersion.toLowerCase().includes(query) ||
        modelo.numeroSerie.toLowerCase().includes(query)
      );
    });
  }, [modelos, searchQuery, marcasList, tiposEquipo]);

  const groupedModelos = useMemo(() => {
    const groups: Record<string, Record<string, Modelo[]>> = {};

    filteredModelos.forEach(modelo => {
      const tipo = tiposEquipo.find(t => t.id === modelo.tipoEquipoId);
      const marca = marcasList.find(m => m.id === modelo.marcaId);

      if (tipo && marca) {
        if (!groups[tipo.nombre]) {
          groups[tipo.nombre] = {};
        }
        if (!groups[tipo.nombre][marca.nombre]) {
          groups[tipo.nombre][marca.nombre] = [];
        }
        groups[tipo.nombre][marca.nombre].push(modelo);
      }
    });

    return groups;
  }, [filteredModelos, tiposEquipo, marcasList]);

  // Manejadores de modales corregidos
  const handleOpenModeloModal = (modelo: Modelo) => {
    setSelectedModelo(modelo);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleOpenRepuestosModal = (modelo: Modelo) => {
    setRepuestosModelo(modelo);
    setIsRepuestosModalOpen(true);
  };

  const handleCreateModelo = () => {
    setSelectedModelo(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  // Todo esto eventualmente escalará a llamadas fetch/axios hacia tu modelosController
  const handleSaveModelo = (modeloData: Omit<Modelo, 'id'>) => {
    if (selectedModelo) {
      setModelos(prev =>
        prev.map(m => (m.id === selectedModelo.id ? { ...m, ...modeloData } : m))
      );
    } else {
      const newModelo: Modelo = {
        ...modeloData,
        id: Date.now().toString(),
      };
      setModelos(prev => [newModelo, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteModelo = (id: string) => {
    setModelos(prev => prev.filter(m => m.id !== id));
    setIsModalOpen(false);
  };

  // Manejadores interactivos para el modal de repuestos asociados
  const handleAddRepuesto = (newLink: RepuestoModelo) => {
    setRepuestosState(prev => [...prev, newLink]);
  };

  const handleAddNewRepuesto = (newRepuesto: Repuesto, newLink: RepuestoModelo) => {
    setListaRepuestosState(prev => [...prev, newRepuesto]);
    setRepuestosState(prev => [...prev, newLink]);
  };

  const getRepuestosCount = (modeloId: string) =>
    repuestosState.filter(rm => rm.modeloId === modeloId).length;

  if (loading) {
    return <div className="py-10 text-center text-gray-600">Cargando modelos...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Modelos</h2>
          <p className="text-gray-600 mt-1">
            {filteredModelos.length} modelo{filteredModelos.length !== 1 ? 's' : ''} registrado{filteredModelos.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleCreateModelo}
            className="bg-[#FF6B35] hover:bg-[#E5582C] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Modelo
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre, marca, tipo, año o número de serie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Listado de Modelos */}
      {Object.keys(groupedModelos).length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Box className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron modelos</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Intenta con otro término de búsqueda' : 'Comienza registrando tu primer modelo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedModelos).map(([tipoNombre, marcasGroup]) => (
            <Card key={tipoNombre}>
              <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <span>{tipoNombre}</span>
                  <Badge variant="secondary">
                    {Object.values(marcasGroup).reduce((acc, models) => acc + models.length, 0)} modelo(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {Object.entries(marcasGroup).map(([marcaNombre, modelosArray]) => (
                    <div key={marcaNombre}>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-gray-900">{marcaNombre}</h4>
                        <Badge className="bg-[#0066CC] hover:bg-[#0052A3]">{modelosArray.length}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {modelosArray.map(modelo => {
                          const repCount = getRepuestosCount(modelo.id);
                          return (
                            <Card
                              key={modelo.id}
                              className="hover:shadow-md transition-all hover:border-[#0066CC]/40"
                            >
                              <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{modelo.nombre}</p>
                                    {modelo.anoVersion && (
                                      <p className="text-sm text-gray-600">Año: {modelo.anoVersion}</p>
                                    )}
                                  </div>
                                  <Box className="w-5 h-5 text-[#0066CC] flex-shrink-0" />
                                </div>
                                
                                {modelo.numeroSerie && (
                                  <p className="text-xs text-gray-500 font-mono mb-1">N/S: {modelo.numeroSerie}</p>
                                )}
                                {modelo.infoTecnica && (
                                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{modelo.infoTecnica}</p>
                                )}

                                {/* Botones de Acción Unificados de Figma */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs h-7 border-[#0066CC]/40 text-[#0066CC] hover:bg-[#0066CC]/5"
                                    onClick={() => handleOpenRepuestosModal(modelo)}
                                  >
                                    <Wrench className="w-3 h-3 mr-1" />
                                    Repuestos
                                    {repCount > 0 && (
                                      <span className="ml-1.5 bg-[#0066CC] text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center leading-none">
                                        {repCount}
                                      </span>
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    className="flex-1 text-xs h-7 bg-[#0066CC] hover:bg-[#0052A3] text-white"
                                    onClick={() => handleOpenModeloModal(modelo)}
                                  >
                                    <Info className="w-3 h-3 mr-1" />
                                    Modelo
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

      {/* Modelo Detail Modal */}
      <ModeloModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modelo={selectedModelo}
        isCreating={isCreating}
        onSave={handleSaveModelo}
        onDelete={handleDeleteModelo}
        allModelos={modelos}
        marcasList={marcasList}
        tiposEquipo={tiposEquipo}
      />

      {/* Repuestos Modal */}
      <RepuestosModal
        isOpen={isRepuestosModalOpen}
        onClose={() => setIsRepuestosModalOpen(false)}
        modelo={repuestosModelo}
        canAdd={isAdmin}
        listaRepuestosState={listaRepuestosState}
        repuestosState={repuestosState}
        onAddRepuesto={handleAddRepuesto}
        onAddNewRepuesto={handleAddNewRepuesto}
      />
    </div>
  );
}
