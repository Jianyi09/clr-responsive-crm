import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Building2, Edit, Trash2, X, Save, MapPin, Phone, Mail, User, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ESTADOS, ZONAS, type Cliente } from '../../data/mockData';
import { toast } from 'sonner';

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  isCreating: boolean;
  onSave: (clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'>) => void;
  onDelete: (id: number) => void;
  allClientes: Cliente[];
}

export function ClienteModal({
  isOpen,
  onClose,
  cliente,
  isCreating,
  onSave,
  onDelete,
  allClientes,
}: ClienteModalProps) {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    razonSocial: '',
    rifDni: '',
    estado: '',
    zona: '',
    telefono: '',
    correo: '',
    contacto: '',
    direccion: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isCreating) {
      setMode('edit');
      setFormData({
        razonSocial: '',
        rifDni: '',
        estado: '',
        zona: '',
        telefono: '',
        correo: '',
        contacto: '',
        direccion: '',
      });
      setErrors({});
    } else if (cliente) {
      setMode('view');
      setFormData({
        razonSocial: cliente.razon_social,
        rifDni: cliente.rif_dni,
        estado: cliente.estado,
        zona: cliente.zona,
        telefono: cliente.numero_telefonico,
        correo: cliente.correo_electronico,
        contacto: cliente.contacto,
        direccion: cliente.direccion,
      });
      setErrors({});
    }
  }, [cliente, isCreating, isOpen]);

  const handleEstadoChange = (estado: string) => {
    setFormData({ ...formData, estado, zona: '' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = 'La razón social es requerida';
    }
    if (!formData.rifDni.trim()) {
      newErrors.rifDni = 'El RIF/DNI es requerido';
    } else {
      // Verificar duplicados
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
    if (!formData.zona) {
      newErrors.zona = 'La zona es requerida';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }
    if (!formData.correo.trim()) {
      newErrors.correo = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = 'El correo no es válido';
    }
    if (!formData.contacto.trim()) {
      newErrors.contacto = 'El contacto es requerido';
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    const clienteData: Omit<Cliente, 'id_clientes' | 'equiposRegistrados'> = {
      razon_social: formData.razonSocial,
      rif_dni: formData.rifDni,
      estado: formData.estado,
      numero_telefonico: formData.telefono,
      correo_electronico: formData.correo,
      contacto: formData.contacto,
      direccion: formData.direccion,
    };

    onSave(clienteData);
    toast.success(isCreating ? 'Cliente creado exitosamente' : 'Cliente actualizado exitosamente');
    onClose();
  };

  const handleDelete = () => {
    if (cliente) {
      onDelete(cliente.id_clientes);
      toast.success('Cliente eliminado exitosamente');
      setShowDeleteDialog(false);
    }
  };

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
          zona: cliente.zona,
          telefono: cliente.numero_telefonico,
          correo: cliente.correo_electronico,
          contacto: cliente.contacto,
          direccion: cliente.direccion,
        });
      }
      setErrors({});
    }
  };

  const zonasDisponibles = formData.estado ? ZONAS[formData.estado] || [] : [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0066CC]" />
              {isCreating ? 'Registrar Nuevo Cliente' : mode === 'view' ? 'Detalles del Cliente' : 'Editar Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {mode === 'view' ? (
              // Vista de lectura
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
                    <p className="text-sm text-gray-500 mb-1">Zona</p>
                    <p className="font-medium">{formData.zona}</p>
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
              // Vista de edición
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
                    <Label htmlFor="telefono">Teléfono *</Label>
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
                        {ESTADOS.map(estado => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.estado && (
                      <p className="text-xs text-red-500 mt-1">{errors.estado}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="zona">Zona *</Label>
                    <Select
                      value={formData.zona}
                      onValueChange={(zona) => setFormData({ ...formData, zona })}
                      disabled={!formData.estado}
                    >
                      <SelectTrigger className={errors.zona ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar zona" />
                      </SelectTrigger>
                      <SelectContent>
                        {zonasDisponibles.map(zona => (
                          <SelectItem key={zona} value={zona}>{zona}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.zona && (
                      <p className="text-xs text-red-500 mt-1">{errors.zona}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="correo">Correo Electrónico *</Label>
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
                    <Label htmlFor="contacto">Nombre de Contacto *</Label>
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
                    <Label htmlFor="direccion">Dirección *</Label>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente
              <strong> {formData.razonSocial}</strong>.
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