import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Box, Edit, Trash2, X, Save, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { type Marca, type Modelo, type TipoEquipo } from '../../data/mockData';
import { toast } from 'sonner';

interface ModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: Modelo | null;
  isCreating: boolean;
  onSave: (modeloData: Omit<Modelo, 'id'>) => void;
  onDelete: (id: string) => void;
  allModelos: Modelo[];
  marcasList: Marca[];
  tiposEquipo: TipoEquipo[];
}

export function ModeloModal({
  isOpen,
  onClose,
  modelo,
  isCreating,
  onSave,
  onDelete,
  allModelos,
  marcasList,
  tiposEquipo,
}: ModeloModalProps) {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    marcaId: '',
    tipoEquipoId: '',
    anoVersion: '',
    numeroSerie: '',
    infoTecnica: '',
    enlaceFichaTecnica: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isCreating) {
      setMode('edit');
      setFormData({
        nombre: '',
        marcaId: '',
        tipoEquipoId: '',
        anoVersion: '',
        numeroSerie: '',
        infoTecnica: '',
        enlaceFichaTecnica: '',
      });
      setErrors({});
    } else if (modelo) {
      setMode('view');
      setFormData(modelo);
      setErrors({});
    }
  }, [modelo, isCreating, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del modelo es requerido';
    }
    if (!formData.marcaId) {
      newErrors.marcaId = 'La marca es requerida';
    }
    if (!formData.tipoEquipoId) {
      newErrors.tipoEquipoId = 'El tipo de equipo es requerido';
    }
    if (!formData.numeroSerie.trim()) {
      newErrors.numeroSerie = 'El número de serie es requerido';
    }

    // Validar URL si se proporciona
    if (formData.enlaceFichaTecnica && formData.enlaceFichaTecnica.trim()) {
      try {
        new URL(formData.enlaceFichaTecnica);
      } catch {
        newErrors.enlaceFichaTecnica = 'La URL no es válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    onSave(formData);
    toast.success(isCreating ? 'Modelo creado exitosamente' : 'Modelo actualizado exitosamente');
  };

  const handleDelete = () => {
    if (modelo) {
      onDelete(modelo.id);
      toast.success('Modelo eliminado exitosamente');
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      onClose();
    } else {
      setMode('view');
      if (modelo) {
        setFormData(modelo);
      }
      setErrors({});
    }
  };

  // Busca la marca usando tu interfaz con 'marcaNombre'
  const nombreMarcaAMostrar = 
    (formData as any).marca_nombre || 
    marcasList.find(m => String(m.id) === String(formData.marcaId))?.marcaNombre || 
    'Sin Marca';

  // Busca el tipo usando tu interfaz con 'tipoNombre'
  const nombreTipoAMostrar = 
    (formData as any).tipo_nombre || 
    tiposEquipo.find(t => String(t.id) === String(formData.tipoEquipoId))?.tipoNombre || 
    'Sin Tipo';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="w-5 h-5 text-green-600" />
              {isCreating ? 'Registrar Nuevo Modelo' : mode === 'view' ? 'Detalles del Modelo' : 'Editar Modelo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {mode === 'view' ? (
              // Vista de lectura
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Nombre del Modelo</p>
                    <p className="font-medium text-lg">{formData.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Marca</p>
                    <p className="font-medium">{nombreMarcaAMostrar}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo de Equipo</p>
                    <p className="font-medium">{nombreTipoAMostrar}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Año / Versión</p>
                    <p className="font-medium">{formData.anoVersion || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Número de Serie</p>
                    <p className="font-medium font-mono">{formData.numeroSerie}</p>
                  </div>
                </div>
                {formData.infoTecnica && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Información Técnica</p>
                    <p className="font-medium">{formData.infoTecnica}</p>
                  </div>
                )}
                {formData.enlaceFichaTecnica && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Enlace Ficha Técnica</p>
                    <a
                      href={formData.enlaceFichaTecnica}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0066CC] hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="w-4 h-4" />
                      {formData.enlaceFichaTecnica}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              // Vista de edición
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nombre">Nombre del Modelo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: CAT 320D"
                      className={errors.nombre ? 'border-red-500' : ''}
                    />
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                  </div>

                  <div>
                    <Label htmlFor="marcaId">Marca *</Label>
                    <Select value={formData.marcaId} onValueChange={(value) => setFormData({ ...formData, marcaId: value })}>
                      <SelectTrigger className={errors.marcaId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {marcasList.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.marcaNombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.marcaId && <p className="text-xs text-red-500 mt-1">{errors.marcaId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="tipoEquipoId">Tipo de Equipo *</Label>
                    <Select value={formData.tipoEquipoId} onValueChange={(value) => setFormData({ ...formData, tipoEquipoId: value })}>
                      <SelectTrigger className={errors.tipoEquipoId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEquipo.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.tipoNombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tipoEquipoId && <p className="text-xs text-red-500 mt-1">{errors.tipoEquipoId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="anoVersion">Año / Versión</Label>
                    <Input
                      id="anoVersion"
                      value={formData.anoVersion}
                      onChange={(e) => setFormData({ ...formData, anoVersion: e.target.value })}
                      placeholder="Ej: 2020"
                    />
                  </div>

                  <div>
                    <Label htmlFor="numeroSerie">Número de Serie *</Label>
                    <Input
                      id="numeroSerie"
                      value={formData.numeroSerie}
                      onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                      placeholder="Ej: CAT320D-2020"
                      className={errors.numeroSerie ? 'border-red-500' : ''}
                    />
                    {errors.numeroSerie && <p className="text-xs text-red-500 mt-1">{errors.numeroSerie}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="infoTecnica">Información Técnica</Label>
                    <Textarea
                      id="infoTecnica"
                      value={formData.infoTecnica}
                      onChange={(e) => setFormData({ ...formData, infoTecnica: e.target.value })}
                      placeholder="Ej: Motor C4.4, 121 HP, peso 20.5 ton"
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="enlaceFichaTecnica">Enlace Ficha Técnica</Label>
                    <Input
                      id="enlaceFichaTecnica"
                      type="url"
                      value={formData.enlaceFichaTecnica}
                      onChange={(e) => setFormData({ ...formData, enlaceFichaTecnica: e.target.value })}
                      placeholder="https://ejemplo.com/ficha-tecnica"
                      className={errors.enlaceFichaTecnica ? 'border-red-500' : ''}
                    />
                    {errors.enlaceFichaTecnica && <p className="text-xs text-red-500 mt-1">{errors.enlaceFichaTecnica}</p>}
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
                  Eliminar Modelo
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
            <AlertDialogTitle>¿Está seguro de eliminar este modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el modelo
              <strong> {formData.nombre}</strong>.
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
