import { useState, useEffect } from 'react';
// Componentes de interfaz basados en Radix UI / Shadcn
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
// Librería de iconos vectoriales para la interfaz
import { Building2, Edit, Trash2, X, Save, MapPin, Phone, Mail, User, Hash } from 'lucide-react';
// Contexto de autenticación para control de accesos basados en roles
import { useAuth } from '../../context/AuthContext';
// Estructuras de datos locales e interfaces de tipado estático
import { type Cliente } from '../../data/mockData';
// Notificaciones flotantes en tiempo real
import { toast } from 'sonner';

/**
 * Definición de las propiedades (Props) del componente ClienteModal.
 */
interface ClienteModalProps {
  isOpen: boolean;             // Controla la visibilidad del modal superior
  onClose: () => void;         // Función disparada al cerrar el componente
  cliente: Cliente | null;     // Datos del cliente seleccionado (null si se está creando)
  isCreating: boolean;         // Flag booleano que determina si es un nuevo registro
  // onSave: Recibe los datos omitiendo los campos autogenerados por PostgreSQL
  onSave: (clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'>) => void;
  onDelete: (id: number) => void; // Función encargada de despachar la remoción física/lógica
  allClientes: Cliente[];      // Arreglo completo en memoria utilizado para validaciones cruzadas (duplicados)
  catalogUbicaciones: Record<string, string[]>; // Catálogo geográfico dinámico inyectado desde el backend
  listaEstados: string[];
}

export function ClienteModal({
  isOpen,
  onClose,
  cliente,
  isCreating,
  onSave,
  onDelete,
  allClientes,
  catalogUbicaciones,
  listaEstados
}: ClienteModalProps) {
  // Extrae el rol de usuario para habilitar/deshabilitar acciones críticas de escritura
  const { isAdmin } = useAuth();
  
  // Estado que determina si la vista actual es de sólo lectura o edición/escritura
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  
  // Estado para controlar la apertura del sub-modal de alerta para eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Estado estructurado del formulario (Frontend) mapeado semánticamente
  const [formData, setFormData] = useState({
    razonSocial: '',
    rifDni: '',
    estado: '',
    ciudad: '',
    telefono: '',
    correo: '',
    contacto: '',
    direccion: '',
  });

  // Estado que almacena strings de error indexados por cada clave del formulario
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Sincroniza los estados internos del formulario cada vez que el ciclo de vida del modal
   * se ve alterado por un cambio de cliente, acción de creación o visibilidad.
   */
  useEffect(() => {
    if (isCreating) {
      setMode('edit');
      setFormData({
        razonSocial: '',
        rifDni: '',
        estado: '',
        ciudad: '',
        telefono: '',
        correo: '',
        contacto: '',
        direccion: '',
      });
      setErrors({});
    } else if (cliente) {
      setMode('view');
      // Mapea las propiedades snake_case de PostgreSQL a la estructura camelCase del formulario local
      setFormData({
        razonSocial: cliente.razon_social,
        rifDni: cliente.rif_dni,
        estado: cliente.estado,
        ciudad: cliente.ciudad,
        telefono: cliente.numero_telefonico,
        correo: cliente.correo_electronico,
        contacto: cliente.contacto,
        direccion: cliente.direccion,
      });
      setErrors({});
    }
  }, [cliente, isCreating, isOpen]);

  /**
   * Maneja el cambio de estado regional, reseteando la ciudad seleccionada
   * para evitar inconsistencias geográficas en los selects anidados.
   */
  const handleEstadoChange = (estado: string) => {
    setFormData({ ...formData, estado, ciudad: '' });
  };

  /**
   * Valida las reglas de negocio del formulario en el Frontend antes de enviar datos a la API.
   * Retorna true si el formulario es completamente válido.
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = 'La razón social es requerida';
    }
    if (!formData.rifDni.trim()) {
      newErrors.rifDni = 'El RIF/DNI es requerido';
    } else {
      // Región de Validación Cruzada: Previene duplicación de identificadores fiscales únicos (RIF)
      const isDuplicate = allClientes.some(
        c => c.rif_dni === formData.rifDni && c.id_clientes !== cliente?.id_clientes
      );
      if (isDuplicate) {
        newErrors.rifDni = 'Ya existe un cliente con este RIF/DNI';
      }
    }
    if (!formData.estado) {
      newErrors.estado = 'El estado es requerido';
    }
    // Validación sintáctica del correo mediante expresiones regulares (RegEx)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Procesa el guardado seguro de la información tras superar la capa de validación.
   */
  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    // Convierte la estructura camelCase del formulario de vuelta al molde exacto que espera PostgreSQL
    const clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'> = {
      razon_social: formData.razonSocial,
      rif_dni: formData.rifDni,
      estado: formData.estado,
      ciudad: formData.ciudad,
      numero_telefonico: formData.telefono,
      correo_electronico: formData.correo,
      contacto: formData.contacto,
      direccion: formData.direccion,
    };

    onSave(clienteData);
    toast.success(isCreating ? 'Cliente creado exitosamente' : 'Cliente actualizado exitosamente');
    onClose();
  };

  /**
   * Ejecuta la remoción lógica o física del cliente delegando el identificador único al ancestro.
   */
  const handleDelete = () => {
    if (cliente) {
      onDelete(cliente.id_clientes);
      toast.success('Cliente eliminado exitosamente');
      setShowDeleteDialog(false);
    }
  };

  /**
   * Cancela la operación en curso, revirtiendo los cambios locales al estado inicial
   * del objeto cliente provisto por las propiedades.
   */
  const handleCancel = () => {
    if (isCreating) {
      onClose();
    } else {
      setMode('view');
      if (cliente) {
        setFormData({
          razonSocial: cliente.razon_social,
          rifDni: cliente.rif_dni,
          estado: cliente.estado,
          ciudad: cliente.ciudad,
          telefono: cliente.numero_telefonico,
          correo: cliente.correo_electronico,
          contacto: cliente.contacto,
          direccion: cliente.direccion,
        });
      }
      setErrors({});
    }
  };

  // Filtrado reactivo en tiempo de ejecución de las ciudades asociadas al estado seleccionado
  // Dentro de tu ClienteModal, cambia la línea 158 por:
  const ciudadesDisponibles = formData.estado ? catalogUbicaciones[formData.estado] || [] : [];

  return (
    <>
      {/* Modal Principal de Clientes */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0066CC]" />
              {/* Encabezado Dinámico basado en la máquina de estados local */}
              {isCreating ? 'Registrar Nuevo Cliente' : mode === 'view' ? 'Detalles del Cliente' : 'Editar Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {mode === 'view' ? (
              // ==========================================
              // VISTA DE LECTURA (SÓLO ACCESIBLE / CONSULTA)
              // ==========================================
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Razón Social</p>
                    <p className="font-medium">{formData.razonSocial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">RIF/DNI</p>
                    <p className="font-medium">{formData.rifDni}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estado</p>
                    <p className="font-medium flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {formData.estado}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ciudad</p>
                    <p className="font-medium">{formData.ciudad}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Teléfono</p>
                    <p className="font-medium flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {formData.telefono}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Correo</p>
                    <p className="font-medium flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-gray-400" />
                      {formData.correo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Contacto</p>
                    <p className="font-medium flex items-center">
                      <User className="w-4 h-4 mr-1 text-gray-400" />
                      {formData.contacto}
                    </p>
                  </div>
                  {/* El totalizador de equipos sólo se renderiza si el cliente ya existe físicamente */}
                  {cliente && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Equipos Registrados</p>
                      <p className="font-medium flex items-center">
                        <Hash className="w-4 h-4 mr-1 text-gray-400" />
                        {cliente.equiposRegistrados}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dirección</p>
                  <p className="font-medium">{formData.direccion}</p>
                </div>
              </div>
            ) : (
              // ==========================================
              // VISTA DE EDICIÓN / ESCRITURA (FORMULARIO ACTIVO)
              // ==========================================
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="razonSocial">Razón Social *</Label>
                    <Input
                      id="razonSocial"
                      value={formData.razonSocial}
                      onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                      placeholder="Ej: Construcciones del Este, C. por A."
                      className={errors.razonSocial ? 'border-red-500' : ''}
                    />
                    {errors.razonSocial && (
                      <p className="text-xs text-red-500 mt-1">{errors.razonSocial}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="rifDni">RIF/DNI *</Label>
                    <Input
                      id="rifDni"
                      value={formData.rifDni}
                      onChange={(e) => setFormData({ ...formData, rifDni: e.target.value })}
                      placeholder="Ej: J-0301234567"
                      className={errors.rifDni ? 'border-red-500' : ''}
                    />
                    {errors.rifDni && (
                      <p className="text-xs text-red-500 mt-1">{errors.rifDni}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono </Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="Ej: 809-555-0101"
                      className={errors.telefono ? 'border-red-500' : ''}
                    />
                    {errors.telefono && (
                      <p className="text-xs text-red-500 mt-1">{errors.telefono}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="estado">Estado *</Label>
                    <Select value={formData.estado} onValueChange={handleEstadoChange}>
                      <SelectTrigger className={errors.estado ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {listaEstados.map(estado => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.estado && (
                      <p className="text-xs text-red-500 mt-1">{errors.estado}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ciudad">Ciudad </Label>
                    <Select
                      value={formData.ciudad}
                      onValueChange={(ciudad) => setFormData({ ...formData, ciudad })}
                      disabled={!formData.estado} // Bloqueado reactivamente si no hay estado previo
                    >
                      <SelectTrigger className={errors.ciudad ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar ciudad" />
                      </SelectTrigger>
                      <SelectContent>
                        {ciudadesDisponibles.map(ciudad => (
                          <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ciudad && (
                      <p className="text-xs text-red-500 mt-1">{errors.ciudad}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="correo">Correo Electrónico </Label>
                    <Input
                      id="correo"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      placeholder="Ej: contacto@empresa.com"
                      className={errors.correo ? 'border-red-500' : ''}
                    />
                    {errors.correo && (
                      <p className="text-xs text-red-500 mt-1">{errors.correo}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contacto">Nombre de Contacto </Label>
                    <Input
                      id="contacto"
                      value={formData.contacto}
                      onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className={errors.contacto ? 'border-red-500' : ''}
                    />
                    {errors.contacto && (
                      <p className="text-xs text-red-500 mt-1">{errors.contacto}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="direccion">Dirección </Label>
                    <Textarea
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Ej: Av. Libertad #45, La Romana"
                      rows={3}
                      className={errors.direccion ? 'border-red-500' : ''}
                    />
                    {errors.direccion && (
                      <p className="text-xs text-red-500 mt-1">{errors.direccion}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acciones de Footer Condicionales según los permisos del usuario y el modo activo */}
          <DialogFooter>
            {isAdmin && mode === 'view' ? (
              <>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Cliente
                </Button>
                <Button onClick={() => setMode('edit')} className="bg-[#0066CC] hover:bg-[#0052A3]">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Registro
                </Button>
              </>
            ) : mode === 'edit' ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} className="bg-[#FF6B35] hover:bg-[#E5582C]">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Modal de Alerta: Confirmación Crítica de Eliminación (Radix AlertDialog) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              <strong> {formData.razonSocial}</strong> y sus dependencias asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}