import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Box, Search, Plus, Package, Wrench, Info } from 'lucide-react';

// Importación de tipos e interfaces estructuradas del Frontend
import {
  type Marca,
  type Modelo,
  type TipoEquipo,
  type Repuesto,
  type RepuestoModelo,
} from '../data/mockData'; 

// Importación de subcomponentes modales (Formularios y detalles)
import { ModeloModal } from '../components/modals/ModeloModal';
import { RepuestosModal } from '../components/modals/RepuestosModal';

// Contexto global para validar permisos basados en roles de usuario (ej. Admin)
import { useAuth } from '../context/AuthContext';

// Importación de las funciones de comunicación asíncronas (Puente API)
import { 
  getModelosApi, 
  saveModeloApi, 
  deleteModeloApi, 
  getAllRepuestosModelosLinksApi,
  asociarRepuestoApi
} from '../services/modelosApi';

import { saveMarcaApi } from '../services/marcasApi';

export function Modelos() {
  // ==========================================
  // ESTADOS PRINCIPALES Y PERMISOS DE LA VISTA
  // ==========================================
  const { isAdmin } = useAuth(); // Extrae si el usuario tiene rol administrativo
  const [modelos, setModelos] = useState<Modelo[]>([]); // Almacena el catálogo de modelos reales traídos de la BD
  const [marcasList, setMarcasList] = useState<Marca[]>([]); // Lista de marcas para alimentar los filtros/modales
  const [tiposEquipo, setTiposEquipoList] = useState<TipoEquipo[]>([]); // Lista de tipos de equipos disponibles
  const [marcas, setMarcas] = useState<Marca[]>([]);

  // Estados dedicados al puente interactivo con el catálogo e histórico de repuestos asociados
  const [repuestosState, setRepuestosState] = useState<RepuestoModelo[]>([]); // Tabla relacional intermedia (Links)
  const [listaRepuestosState, setListaRepuestosState] = useState<Repuesto[]>([]); // Catálogo maestro de repuestos

  // Estados de control de UI y carga reactiva
  const [searchQuery, setSearchQuery] = useState(''); // Guarda la cadena de texto del cuadro de búsqueda global
  const [loading, setLoading] = useState(true); // Controla el renderizado de la pantalla de carga
  const [error, setError] = useState(''); // Captura mensajes de error en peticiones HTTP

  // Estados del Modal de Gestión de Modelos (Crear / Ver / Editar)
  const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null); // Modelo seleccionado para inspección o edición
  const [isModalOpen, setIsModalOpen] = useState(false); // Flag de apertura/cierre del modal principal
  const [isCreating, setIsCreating] = useState(false); // Flag para indicarle al modal si debe abrirse en modo inserción vacía

  // Estados del Modal Secundario de Repuestos (Asociados al modelo)
  const [repuestosModelo, setRepuestosModelo] = useState<Modelo | null>(null); // Rastrea de qué modelo estamos inspeccionando repuestos
  const [isRepuestosModalOpen, setIsRepuestosModalOpen] = useState(false); // Flag de apertura del modal de repuestos
  

  // ==========================================
  // EFECTO DE CARGA INICIAL (PUENTE BACKEND)
  // ==========================================
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [data, linksData] = await Promise.all([
          getModelosApi(),
          getAllRepuestosModelosLinksApi().catch(() => []), // Captura preventiva por si la tabla relacional está vacía
        ]);

        // Seteo en los estados reactivos de la aplicación
        setModelos(data.modelos);
        setMarcasList(data.marcas);
        setTiposEquipoList(data.tiposEquipo)
        setRepuestosState(linksData);

      } catch (err: any) {
        console.error(err);
        setError('No se pudieron cargar los datos de modelos.');
      } finally {
        setLoading(false); // Apaga el spinner o indicador visual de carga
      }
    }

    loadData();
  }, []);

  // ==========================================
  // COMPUTACIONES FILTRADAS Y OPTIMIZADAS
  // ==========================================
  
  // FILTRO 1: Buscador en tiempo real por concordancia de texto
  const filteredModelos = useMemo(() => {
    if (!searchQuery) return modelos;

    const query = searchQuery.toLowerCase();
    return modelos.filter(modelo => {
      return (
        modelo.nombre.toLowerCase().includes(query) ||
        modelo.anoVersion.toLowerCase().includes(query) ||
        modelo.numeroSerie.toLowerCase().includes(query) ||
        (modelo as any).marcaNombre?.toLowerCase().includes(query) || // Búsqueda sobre el alias de la marca
        (modelo as any).tipoNombre?.toLowerCase().includes(query)     // Búsqueda sobre el alias del tipo de equipo
      );
    });
  }, [modelos, searchQuery]);

  // FILTRO 2: Agrupación matricial bidimensional (Tipo de Equipo -> Marcas -> Modelos[])
  const groupedModelos = useMemo(() => {
    const groups: Record<string, Record<string, Modelo[]>> = {};

    filteredModelos.forEach(modelo => {
      // Usamos los alias inyectados por los JOINs del controlador de la base de datos
      const tipoNombre = (modelo as any).tipoNombre || 'Sin Tipo';
      const marcaNombre = (modelo as any).marcaNombre || 'Sin Marca';

      // Inicialización estructurada del árbol de claves del objeto si no existen
      if (!groups[tipoNombre]) {
        groups[tipoNombre] = {};
      }
      if (!groups[tipoNombre][marcaNombre]) {
        groups[tipoNombre][marcaNombre] = [];
      }
      // Inserción del modelo dentro de su hoja correspondiente
      groups[tipoNombre][marcaNombre].push(modelo);
    });

    return groups;
  }, [filteredModelos]);

  // ==========================================
  // MANEJADORES DE EVENTOS DE INTERFAZ (UI)
  // ==========================================
  
  // Abre el modal para visualizar los detalles técnicos de un modelo existente
  const handleOpenModeloModal = (modelo: Modelo) => {
    setSelectedModelo(modelo);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  // Abre el modal dedicado a revisar y enlazar repuestos al modelo clickeado
  const handleOpenRepuestosModal = (modelo: Modelo) => {
    setRepuestosModelo(modelo);
    setIsRepuestosModalOpen(true);
  };

  // Prepara el formulario del modal en blanco para el registro de una entidad nueva
  const handleCreateModelo = () => {
    setSelectedModelo(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  // ==========================================
  // PROCESAMIENTO LOCAL DE FORMULARIOS (PROPS)
  // ==========================================
  
  // Guarda cambios de edición o creación (Mutación temporal hasta enganchar fetch directo)
  const handleSaveModelo = async (modeloData: Omit<Modelo, 'id'>) => {
    try {
      const idParaApi = selectedModelo ? selectedModelo.id : undefined;
      const idGenerado = await saveModeloApi(modeloData, idParaApi);

    if (selectedModelo) {
      setModelos(prev =>
        prev.map(m => (m.id === selectedModelo.id ? { ...m, ...modeloData } : m))
      );
    } else {
      const newModelo: Modelo = {
        ...modeloData,
        id: idGenerado,
      };
      setModelos(prev => [newModelo, ...prev]);
    }
    setIsModalOpen(false); // Cierre exitoso del cuadro de diálogo
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'Error al intentar guardar el modelo.');
  } finally {
    setLoading(false);
  }
};

const handleAddMarcaAsync = async (marcaNombre: string): Promise<Marca> => {
  try {
    const nuevaMarca = await saveMarcaApi(marcaNombre);
    setMarcas(prev => [...prev, nuevaMarca]); // Al impactar el estado, el dropdown se actualiza solo
    return nuevaMarca;
  } catch (err: any) {
    throw new Error(err.message || 'No se pudo registrar la marca.');
  }
};

// Remueve un modelo de la base de datos y actualiza el estado local
const handleDeleteModelo = async (id: string) => {
  try {
    setLoading(true);
    
    // Llamada física al endpoint DELETE /api/modelos/:id
    await deleteModeloApi(id);
    
    // Si el servidor responde OK, lo quitamos de la UI
    setModelos(prev => prev.filter(m => m.id !== id));
    setIsModalOpen(false);
  } catch (err: any) {
    console.error(err);
    setError(err.message || 'No se pudo eliminar el modelo del servidor.');
  } finally {
    setLoading(false);
  }
};

  // Agrega una nueva relación intermedia entre un repuesto existente y el modelo activo
  const handleAddRepuesto = async (newLink: RepuestoModelo) => {
    if (!repuestosModelo) return;
    try {
      const response = await asociarRepuestoApi(repuestosModelo.id, {
        tipo: 'existing',
        repuestoId: newLink.repuestoId
      });
      setRepuestosState(prev => [...prev, response.link]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al asociar el repuesto existente.');
    }
  };

  // Inserción simultánea: registra un repuesto inédito en el catálogo y crea su enlace con el modelo
  const handleAddNewRepuesto = async (newRepuesto: Repuesto, newLink: RepuestoModelo) => {
    if (!repuestosModelo) return;
    try {
      const response = await asociarRepuestoApi(repuestosModelo.id, {
        tipo: 'new',
        repuestoId: null,
        nuevoRepuesto: {
          nombre: newRepuesto.nombre,
          codigoParte: newRepuesto.codigoParte,
          infoTecnica: newRepuesto.infoTecnica
        }
      });

      if (response.repuesto) {
        setListaRepuestosState(prev => [...prev, response.repuesto!]);
      }
      setRepuestosState(prev => [...prev, response.link]);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al registrar el nuevo repuesto.');
    }
  };

  // Helper dinámico para renderizar el contador numérico de repuestos en las tarjetas
  const getRepuestosCount = (modeloId: string) =>
    repuestosState.filter(rm => rm.modeloId === modeloId).length;

  // ==========================================
  // RENDERIZADO DE ALERTAS / PANTALLAS DE CONTROL
  // ==========================================
  if (loading) {
    return <div className="py-10 text-center text-gray-600">Cargando modelos...</div>;
  }

  if (error) {
    return <div className="py-10 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* SECCIÓN DEL HEADER: Título principal de la página y botón de creación */}
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

      {/* CUADRO DE BÚSQUEDA GLOBAL */}
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

      {/* RENDERIZADO CONDICIONAL: Mensaje vacío u objetos agrupados mapeados */}
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
          {/* PRIMER NIVEL DE ITERACIÓN: Separación por Tipo de Equipo */}
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
                  {/* SEGUNDO NIVEL DE ITERACIÓN: Separación interna por Marcas */}
                  {Object.entries(marcasGroup).map(([marcaNombre, modelosArray]) => (
                    <div key={marcaNombre}>
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-gray-900">{marcaNombre}</h4>
                        <Badge className="bg-[#0066CC] hover:bg-[#0052A3]">{modelosArray.length}</Badge>
                      </div>

                      {/* TERCER NIVEL: Malla (Grid) de Tarjetas Individuales de los Modelos */}
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

                                {/* BOTONES DE ACCIÓN: Vinculación a modales secundarios */}
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

      {/* COMPONENTE INYECTADO: Modal de edición/lectura de datos técnicos del Modelo */}
      <ModeloModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modelo={selectedModelo}
        isCreating={isCreating}
        onSave={handleSaveModelo}
        onDelete={handleDeleteModelo}
        marcasList={marcasList}
        tiposEquipo={tiposEquipo}
        onAddMarcaAsync={handleAddMarcaAsync}
      />

      {/* COMPONENTE INYECTADO: Modal de catálogo de repuestos asociados */}
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