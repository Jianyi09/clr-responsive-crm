// ==========================================
// 1. IMPORTACIONES DE LIBRERÍAS Y COMPONENTES
// ==========================================

// Importamos Hooks fundamentales de React:
// - useEffect: Para ejecutar código automáticamente (como llamar a la base de datos al cargar la página).
// - useState: Para crear variables de estado que React vigila para redibujar la pantalla si cambian.
// - useMemo: Para optimizar el rendimiento (ej. memorizar el resultado de un filtrado de búsqueda).
import { useEffect, useState, useMemo } from 'react';

// Importamos componentes de diseño visual prefabricados (Tarjetas, Inputs, Botones y Etiquetas)
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Importamos iconos estilizados de la librería lucide-react para la interfaz gráfica
import { Building2, MapPin, Phone, Mail, Search, Plus } from 'lucide-react';

// Importamos la definición de tipo 'Cliente' para que TypeScript sepa qué propiedades tiene un cliente
import { type Cliente } from '../data/mockData';

// Importamos la función encargada de comunicarse con el servidor/backend para traer los datos
// Usamos el endpoint de clientesController para obtener estado, ciudad y equipos registrados.
import { getClientesApi } from '../services/api';

// Importamos el componente de la ventana emergente (modal) para crear, editar o eliminar clientes
import { ClienteModal } from '../components/modals/ClienteModal';

// Importamos el Hook personalizado de autenticación para saber si el usuario actual tiene permisos
import { useAuth } from '../context/AuthContext';

// ==========================================
// 2. COMPONENTE PRINCIPAL: Clientes
// ==========================================
export function Clientes() {
  
  // ==========================================
  // 3. DECLARACIÓN DE ESTADOS (STATE)
  // ==========================================
  
  // Extraemos la propiedad isAdmin del contexto global de autenticación
  const { isAdmin } = useAuth();
  
  // Estado principal que guarda el array con todos los clientes traídos de la base de datos
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Guarda el texto que el usuario escribe en la barra de búsqueda rápida
  const [searchQuery, setSearchQuery] = useState('');
  
  // Guarda el objeto del cliente que el usuario seleccionó (hizo clic) para ver o editar en el modal
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  // Controla si la ventana emergente (modal) está visible (true) o invisible (false)
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Bandera para decirle al modal si se abrió para registrar un cliente nuevo (true) o para editar uno existente (false)
  const [isCreating, setIsCreating] = useState(false);
  
  // Estado que controla si la pantalla está cargando datos del backend (muestra un mensaje de "Cargando...")
  const [loading, setLoading] = useState(true);
  
  // Guarda un mensaje de error string en caso de que la conexión con el servidor falle
  const [error, setError] = useState('');

  // Estado que almacena un catálogo de ubicaciones (estados y ciudades) para mostrar en los dropdowns del modal
  const [catalogUbicaciones, setCatalogUbicaciones] = useState<Record<string, string[]>>({});
 // Estado que almacena una lista de estados para mostrar en el dropdown del modal
  const [listaEstados, setListaEstados] = useState<string[]>([]);

  // ==========================================
  // 4. EFECTOS (EFECTO DE CARGA INICIAL - BACKEND)
  // ==========================================
  useEffect(() => {
    // Definimos una función asíncrona interna para poder usar 'await' al llamar a la API
    async function loadClientes() {
      try {
        const clientesData = await getClientesApi(); // Llama a la función que hace la petición al backend para obtener los clientes
        if (Array.isArray(clientesData)) { 
          setClientes(clientesData); //
        } else {
          setClientes([]);
          setError('El servidor devolvió un formato de datos inesperado.');
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? `No se pudo conectar al servidor: ${err.message}` : 'No se pudo cargar la lista de clientes.');
      } finally {
        setLoading(false);
      }
    }

    // Ejecutamos la función inmediatamente al renderizar el componente por primera vez
    loadClientes();
  }, []); // El array vacío [] asegura que esto solo ocurra UNA VEZ al cargar la página

  useEffect(() => {
    const cargarUbicaciones = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/clientes/ubicaciones');
        const data = await response.json();
        setCatalogUbicaciones(data);
        setListaEstados(Object.keys(data)); // Almacena los estados disponibles basados en las llaves del JSON
      } catch (error) {
        console.error('Error al conectar catálogo geográfico:', error);
      }
    };
    cargarUbicaciones();
  }, []);

  // ==========================================
  // 5. LÓGICA DE FILTRADO (BÚSQUEDA EN TIEMPO REAL)
  // ==========================================
  // useMemo evita tener que filtrar todo el array de clientes en cada click o render innecesario.
  // Solo se vuelve a calcular si el texto de búsqueda (searchQuery) o la lista de clientes cambian.
  const filteredClientes = useMemo(() => {
    // Si la barra de búsqueda está vacía, devuelve todos los clientes de la base de datos directamente
    if (!Array.isArray(clientes)) return [];
    if (!searchQuery) return clientes;
    
    const query = searchQuery.toLowerCase().trim(); // Convertimos la búsqueda a minúsculas para que no importen las mayúsculas
    
    // Filtramos el array buscando coincidencias en múltiples campos del objeto cliente
    return clientes.filter(
      (cliente) => {
        const razonSocial = (cliente.razon_social || '').toLowerCase();
        const rifDni = (cliente.rif_dni || '').toLowerCase();
        const contacto = (cliente.contacto || '').toLowerCase();
        const estadoName = (cliente.estado || '').toLowerCase();
        const ciudadName = (cliente.ciudad || '').toLowerCase();
        const direccionCompleta = (cliente.direccion || '').toLowerCase();
        const telefono = (cliente.numero_telefonico || '').toLowerCase();
        const correo = (cliente.correo_electronico || '').toLowerCase();

        return (
          razonSocial.includes(query) ||
          rifDni.includes(query) ||
          contacto.includes(query) ||
          estadoName.includes(query) ||
          ciudadName.includes(query) ||
          direccionCompleta.includes(query) ||
          telefono.includes(query) ||
          correo.includes(query)
        );
      });
    }, [clientes, searchQuery]);
  // ==========================================
  // 6. MANEJADORES DE EVENTOS (INTERACCIONES)
  // ==========================================
  
  // Se ejecuta cuando el usuario hace clic sobre la tarjeta de un cliente existente
  const handleClienteClick = (cliente: Cliente) => {
    setSelectedCliente(cliente); // Almacena el cliente seleccionado para enviárselo al modal
    setIsCreating(false);        // Avisa al modal que se trata de una visualización/edición, no de una creación
    setIsModalOpen(true);        // Abre el modal en pantalla
  };

  // Se ejecuta al hacer clic en el botón naranja "Registrar Cliente"
  const handleCreateCliente = () => {
    setSelectedCliente(null);    // Limpia cualquier cliente seleccionado previo (formulario vacío)
    setIsCreating(true);         // Avisa al modal que es un registro completamente nuevo
    setIsModalOpen(true);        // Abre el modal en pantalla
  };

  // Se ejecuta cuando el usuario presiona "Guardar" DENTRO del modal (conexion con BACKEND)
  const handleSaveCliente = async (clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'>) => {
    try {
      // 1. Definimos la URL y el método HTTP correcto dinámicamente según la acción
      const url = isCreating 
        ? 'http://localhost:4000/api/clientes' 
        : `http://localhost:4000/api/clientes/${selectedCliente?.id_clientes}`;
        
      const method = isCreating ? 'POST' : 'PUT';

      // 2. Ejecutamos la petición al servidor mandando el JSON con los datos del formulario
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clienteData),
      });

      if (response.ok) {
        // 3. Si la base de datos procesó el cambio con éxito, refrescamos la lista principal
        // llamando a la misma función que usas en el useEffect de carga inicial
        const clientesData = await getClientesApi();
        setClientes(clientesData);
        
        setIsModalOpen(false); // Cerramos el modal solo si se guardó con éxito
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData.error);
        alert(`Error al guardar: ${errorData.error || 'Inténtalo de nuevo.'}`);
      }
    } catch (error) {
      console.error('Error de red al intentar guardar:', error);
      alert('No se pudo conectar con el servidor backend.');
    }
  };

  // Se ejecuta cuando el usuario presiona "Eliminar" DENTRO del modal de un cliente
  const handleDeleteCliente = async (id: number) => {
    // Una pequeña confirmación de seguridad antes de borrar de la base de datos real
    if (!window.confirm('¿Estás segura de que deseas eliminar este cliente de forma permanente?')) {
      return;
    }

    try {
      // 1. Enviamos la petición DELETE al puerto 4000 con el ID en los parámetros
      const response = await fetch(`http://localhost:4000/api/clientes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 2. Si el servidor borró la fila, lo quitamos de la UI inmediatamente
        setClientes(prev => prev.filter(c => c.id_clientes !== id));
        setIsModalOpen(false); // Cerramos la ventana flotante
      } else {
        const errorData = await response.json();
        console.error('Error al eliminar:', errorData.error);
        alert(`No se pudo eliminar: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error de conexión al intentar eliminar:', error);
      alert('Error de red al intentar eliminar el registro.');
    }
  };

  // ==========================================
  // 7. RENDERIZACIÓN CONDICIONAL (ESTADOS DE ESPERA)
  // ==========================================
  
  // Si la petición a la API sigue pendiente, detiene la ejecución aquí y muestra esta interfaz limpia
  if (loading) {
    return (
      <div className="py-10 text-center text-gray-600">Cargando clientes...</div>
    );
  }

  // Si la conexión falló o el servidor devolvió un error, rompe el flujo y muestra el mensaje de error
  if (error) {
    return (
      <div className="py-10 text-center text-red-600">{error}</div>
    );
  }

  // ==========================================
  // 8. RENDERIZADO DE LA INTERFAZ DE USUARIO (HTML / JSX)
  // ==========================================
  return (
    <div className="space-y-6">
      
      {/* SECCIÓN A: CABECERA (Título y botón de registro) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clientes</h2>
          <p className="text-gray-600 mt-1">
            {/* Calcula dinámicamente cuántos clientes se muestran en pantalla y maneja el plural/singular */}
            {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''} registrado{filteredClientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        {/* Renderizado condicional: El botón naranja solo se dibuja si el usuario es Administrador (isAdmin === true) */}
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
            {/* Input conectado bidireccionalmente con el estado 'searchQuery' */}
            <Input
              type="text"
              placeholder="Buscar por razón social, RIF, contacto, estado o zona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Captura cada tecla o cambio y actualiza el estado
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN C: REJILLA DE CLIENTES / COMPONENTE DE RESULTADOS */}
      {filteredClientes.length === 0 ? (
        // Sub-Caso 1: Si el filtro de búsqueda da 0 resultados, muestra un panel de "No encontrado"
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron clientes
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza registrando tu primer cliente'}
            </p>
          </CardContent>
        </Card>
      ) : (
        // Sub-Caso 2: Si hay clientes en la lista, dibuja una rejilla responsiva (1 col en móvil, 2 en tablet, 3 en desktop)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Bucle .map para recorrer cada uno de los clientes filtrados y transformarlos en una tarjeta visual */}
          {filteredClientes.map((cliente) => (
            <Card
              key={cliente.id_clientes} // Elemento requerido por React para identificar de forma única cada tarjeta en el DOM
              className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
              onClick={() => handleClienteClick(cliente)} // Al dar clic en cualquier parte de la tarjeta se abre su información
            >
              <CardContent className="pt-6">
                {/* Contenedor Superior del Card: Icono del edificio y etiqueta de equipos */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  {/* Badge dinámico: Cambia de color a naranja si el cliente posee equipos activos en tu CRM */}
                  <Badge
                    variant={cliente.equiposRegistrados > 0 ? 'default' : 'secondary'}
                    className={cliente.equiposRegistrados > 0 ? 'bg-[#FF6B35] hover:bg-[#E5582C]' : ''}
                  >
                    {cliente.equiposRegistrados} equipo{cliente.equiposRegistrados !== 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Razón Social del Cliente */}
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
                  {cliente.razon_social}
                </h3>

                {/* Datos de Contacto Directos (Teléfono y Correo) */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{cliente.estado}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{cliente.numero_telefonico}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{cliente.correo_electronico}</span>
                  </div>
                </div>

                {/* Pie de la Tarjeta: Identificación Fiscal (RIF) y persona de contacto */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">RIF:</span> {cliente.rif_dni}
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

      {/* SECCIÓN D: VENTANA MODAL (Oculta por defecto) */}
      {/* Le inyectamos todas las variables de control y los métodos creados anteriormente para que el Modal pueda operar */}
      <ClienteModal
        isOpen={isModalOpen}              // Le dice si debe mostrarse o no
        onClose={() => setIsModalOpen(false)} // Función para cerrarse desde la "X" del modal
        cliente={selectedCliente}          // Pasa los datos del cliente activo (si se seleccionó uno)
        isCreating={isCreating}            // Le indica si el formulario debe estar limpio para creación o no
        onSave={handleSaveCliente}         // Pasa la función que gestionará el guardado
        onDelete={handleDeleteCliente}     // Pasa la función que gestionará la eliminación
        allClientes={clientes}             // Pasa la lista de clientes completa por si requiere validar duplicados (ej. RIF repetidos)
        catalogUbicaciones={catalogUbicaciones} // Pasa el catálogo de ubicaciones para que el modal pueda mostrar los dropdowns dinámicos
        listaEstados={listaEstados}
      />
    </div>
  );
}