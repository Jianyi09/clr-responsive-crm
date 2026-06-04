import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Truck, Edit, Trash2, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { type Cliente, type Equipo, type Marca, type Modelo, type TipoEquipo } from '../../data/mockData';
import { toast } from 'sonner';

interface EquipoModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipo: Equipo | null;
  isCreating: boolean;
  onSave: (equipoData: Omit<Equipo, 'id'>) => void;
  onDelete: (id: string) => void;
  allEquipos: Equipo[];
  clientes: Cliente[];
  tiposEquipo: TipoEquipo[];
  marcasList: Marca[];
  modelosList: Modelo[];
  onAddMarca: (marca: Marca) => void;
  onAddModelo: (modelo: Modelo) => void;
}

export function EquipoModal({
  isOpen,
  onClose,
  equipo,
  isCreating,
  onSave,
  onDelete,
  allEquipos,
  clientes,
  tiposEquipo,
  marcasList,
  modelosList,
  onAddMarca,
  onAddModelo,
}: EquipoModalProps) {
  const { isAdmin } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMarcaDialog, setShowMarcaDialog] = useState(false);
  const [showModeloDialog, setShowModeloDialog] = useState(false);
  const [newMarcaName, setNewMarcaName] = useState('');
  const [newModeloName, setNewModeloName] = useState('');

  const [formData, setFormData] = useState({
    clienteId: '',
    tipoEquipoId: '',
    marcaId: '',
    modeloId: '',
    aliasInterno: '',
    observacion: '',
    serial: '',
    infoTecnica: '',
  });

  const [marcaInput, setMarcaInput] = useState('');
  const [modeloInput, setModeloInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isCreating) {
      setMode('edit');
      setFormData({
        clienteId: '',
        tipoEquipoId: '',
        marcaId: '',
        modeloId: '',
        aliasInterno: '',
        observacion: '',
        serial: '',
        infoTecnica: '',
      });
      setMarcaInput('');
      setModeloInput('');
      setErrors({});
    } else if (equipo) {
      setMode('view');
      setFormData(equipo);
      const marca = marcasList.find(m => m.id === equipo.marcaId);
      const modelo = modelosList.find(m => m.id === equipo.modeloId);
      setMarcaInput(marca?.nombre || '');
      setModeloInput(modelo?.nombre || '');
      setErrors({});
    }
  }, [equipo, isCreating, isOpen, marcasList, modelosList]);

  const modelosDisponibles = useMemo(() => {
    return modelosList.filter(
      m => m.marcaId === formData.marcaId && m.tipoEquipoId === formData.tipoEquipoId
    );
  }, [modelosList, formData.marcaId, formData.tipoEquipoId]);

  const handleMarcaInputChange = (value: string) => {
    setMarcaInput(value);
    const marca = marcasList.find(m => m.nombre.toLowerCase() === value.toLowerCase());
    if (marca) {
      setFormData(prev => ({ ...prev, marcaId: marca.id }));
    } else {
      setFormData(prev => ({ ...prev, marcaId: '' }));
    }
  };

  const handleMarcaInputBlur = () => {
    if (marcaInput && !formData.marcaId) {
      const exists = marcasList.some(m => m.nombre.toLowerCase() === marcaInput.toLowerCase());
      if (!exists) {
        setNewMarcaName(marcaInput);
        setShowMarcaDialog(true);
      }
    }
  };

  const handleCreateMarca = () => {
    const newMarca: Marca = {
      id: Date.now().toString(),
      nombre: newMarcaName,
    };
    onAddMarca(newMarca);
    setFormData(prev => ({ ...prev, marcaId: newMarca.id }));
    setMarcaInput(newMarca.nombre);
    setShowMarcaDialog(false);
    toast.success(`Marca "${newMarca.nombre}" creada exitosamente`);
  };

  const handleModeloInputChange = (value: string) => {
    setModeloInput(value);
    const modelo = modelosDisponibles.find(m => m.nombre.toLowerCase() === value.toLowerCase());
    if (modelo) {
      setFormData(prev => ({ ...prev, modeloId: modelo.id }));
    } else {
      setFormData(prev => ({ ...prev, modeloId: '' }));
    }
  };

  const handleModeloInputBlur = () => {
    if (modeloInput && !formData.modeloId && formData.marcaId && formData.tipoEquipoId) {
      const exists = modelosDisponibles.some(m => m.nombre.toLowerCase() === modeloInput.toLowerCase());
      if (!exists) {
        setNewModeloName(modeloInput);
        setShowModeloDialog(true);
      }
    }
  };

  const handleCreateModelo = () => {
    const newModelo: Modelo = {
      id: Date.now().toString(),
      nombre: newModeloName,
      marcaId: formData.marcaId,
      tipoEquipoId: formData.tipoEquipoId,
      anoVersion: '',
      numeroSerie: '',
      infoTecnica: '',
      enlaceFichaTecnica: '',
    };
    onAddModelo(newModelo);
    setFormData(prev => ({ ...prev, modeloId: newModelo.id }));
    setModeloInput(newModelo.nombre);
    setShowModeloDialog(false);
    toast.success(`Modelo "${newModelo.nombre}" creado exitosamente`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clienteId) {
      newErrors.clienteId = 'El cliente es requerido';
    }
    if (!formData.tipoEquipoId) {
      newErrors.tipoEquipoId = 'El tipo de equipo es requerido';
    }
    if (!formData.marcaId) {
      newErrors.marcaId = 'La marca es requerida';
    }
    if (!formData.modeloId) {
      newErrors.modeloId = 'El modelo es requerido';
    }
    if (!formData.aliasInterno.trim()) {
      newErrors.aliasInterno = 'El alias interno es requerido';
    }
    if (!formData.serial.trim()) {
      newErrors.serial = 'El serial es requerido';
    } else {
      // Verificar duplicados
      const isDuplicate = allEquipos.some(
        e =>
          e.serial === formData.serial &&
          e.marcaId === formData.marcaId &&
          e.id !== equipo?.id
      );
      if (isDuplicate) {
        newErrors.serial = 'Ya existe un equipo con este serial y marca';
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
    toast.success(isCreating ? 'Equipo creado exitosamente' : 'Equipo actualizado exitosamente');
  };

  const handleDelete = () => {
    if (equipo) {
      onDelete(equipo.id);
      toast.success('Equipo eliminado exitosamente');
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      onClose();
    } else {
      setMode('view');
      if (equipo) {
        setFormData(equipo);
        const marca = marcasList.find(m => m.id === equipo.marcaId);
        const modelo = modelosList.find(m => m.id === equipo.modeloId);
        setMarcaInput(marca?.nombre || '');
        setModeloInput(modelo?.nombre || '');
      }
      setErrors({});
    }
  };

  const cliente = clientes.find(c => c.id === formData.clienteId);
  const tipo = tiposEquipo.find(t => t.id === formData.tipoEquipoId);
  const marca = marcasList.find(m => m.id === formData.marcaId);
  const modelo = modelosList.find(m => m.id === formData.modeloId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#FF6B35]" />
              {isCreating ? 'Registrar Nuevo Equipo' : mode === 'view' ? 'Detalles del Equipo' : 'Editar Equipo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {mode === 'view' ? (
              // Vista de lectura
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cliente</p>
                    <p className="font-medium">{cliente?.razonSocial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Alias Interno</p>
                    <p className="font-medium">{formData.aliasInterno}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo de Equipo</p>
                    <p className="font-medium">{tipo?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Marca</p>
                    <p className="font-medium">{marca?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Modelo</p>
                    <p className="font-medium">{modelo?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Serial</p>
                    <p className="font-medium font-mono">{formData.serial}</p>
                  </div>
                </div>
                {formData.observacion && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Observación</p>
                    <p className="font-medium">{formData.observacion}</p>
                  </div>
                )}
                {formData.infoTecnica && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Información Técnica</p>
                    <p className="font-medium">{formData.infoTecnica}</p>
                  </div>
                )}
              </div>
            ) : (
              // Vista de edición
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="clienteId">Cliente *</Label>
                    <Select value={formData.clienteId} onValueChange={(value) => setFormData({ ...formData, clienteId: value })}>
                      <SelectTrigger className={errors.clienteId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.razonSocial}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="tipoEquipoId">Tipo de Equipo *</Label>
                    <Select
                      value={formData.tipoEquipoId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, tipoEquipoId: value, modeloId: '' });
                        setModeloInput('');
                      }}
                    >
                      <SelectTrigger className={errors.tipoEquipoId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEquipo.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.tipoEquipoId && <p className="text-xs text-red-500 mt-1">{errors.tipoEquipoId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="aliasInterno">Alias Interno *</Label>
                    <Input
                      id="aliasInterno"
                      value={formData.aliasInterno}
                      onChange={(e) => setFormData({ ...formData, aliasInterno: e.target.value })}
                      placeholder="Ej: EXC-001"
                      className={errors.aliasInterno ? 'border-red-500' : ''}
                    />
                    {errors.aliasInterno && <p className="text-xs text-red-500 mt-1">{errors.aliasInterno}</p>}
                  </div>

                  <div>
                    <Label htmlFor="marca">Marca *</Label>
                    <div className="relative">
                      <Input
                        id="marca"
                        value={marcaInput}
                        onChange={(e) => handleMarcaInputChange(e.target.value)}
                        onBlur={handleMarcaInputBlur}
                        placeholder="Escriba o seleccione"
                        list="marcas-list"
                        className={errors.marcaId ? 'border-red-500' : ''}
                      />
                      <datalist id="marcas-list">
                        {marcasList.map(m => (
                          <option key={m.id} value={m.nombre} />
                        ))}
                      </datalist>
                    </div>
                    {errors.marcaId && <p className="text-xs text-red-500 mt-1">{errors.marcaId}</p>}
                  </div>

                  <div>
                    <Label htmlFor="modelo">Modelo *</Label>
                    <div className="relative">
                      <Input
                        id="modelo"
                        value={modeloInput}
                        onChange={(e) => handleModeloInputChange(e.target.value)}
                        onBlur={handleModeloInputBlur}
                        placeholder="Escriba o seleccione"
                        list="modelos-list"
                        disabled={!formData.marcaId || !formData.tipoEquipoId}
                        className={errors.modeloId ? 'border-red-500' : ''}
                      />
                      <datalist id="modelos-list">
                        {modelosDisponibles.map(m => (
                          <option key={m.id} value={m.nombre} />
                        ))}
                      </datalist>
                    </div>
                    {errors.modeloId && <p className="text-xs text-red-500 mt-1">{errors.modeloId}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="serial">Serial *</Label>
                    <Input
                      id="serial"
                      value={formData.serial}
                      onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                      placeholder="Ej: CAT320D2020-XYZ123"
                      className={errors.serial ? 'border-red-500' : ''}
                    />
                    {errors.serial && <p className="text-xs text-red-500 mt-1">{errors.serial}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="observacion">Observación</Label>
                    <Textarea
                      id="observacion"
                      value={formData.observacion}
                      onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                      placeholder="Ej: Uso diario en obra principal"
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="infoTecnica">Información Técnica</Label>
                    <Textarea
                      id="infoTecnica"
                      value={formData.infoTecnica}
                      onChange={(e) => setFormData({ ...formData, infoTecnica: e.target.value })}
                      placeholder="Ej: Mantenimiento al día, última revisión: 15/05/2026"
                      rows={3}
                    />
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
                  Eliminar Equipo
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
            <AlertDialogTitle>¿Está seguro de eliminar este equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el equipo
              <strong> {formData.aliasInterno}</strong>.
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

      {/* Create Marca Dialog */}
      <AlertDialog open={showMarcaDialog} onOpenChange={setShowMarcaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <AlertDialogTitle>Marca no encontrada</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              La marca "<strong>{newMarcaName}</strong>" no existe en el sistema. ¿Desea crearla?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarcaInput('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateMarca} className="bg-[#0066CC] hover:bg-[#0052A3]">
              Crear Marca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Modelo Dialog */}
      <AlertDialog open={showModeloDialog} onOpenChange={setShowModeloDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <AlertDialogTitle>Modelo no encontrado</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              El modelo "<strong>{newModeloName}</strong>" no existe en el sistema. ¿Desea crearlo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setModeloInput('')}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateModelo} className="bg-[#0066CC] hover:bg-[#0052A3]">
              Crear Modelo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
