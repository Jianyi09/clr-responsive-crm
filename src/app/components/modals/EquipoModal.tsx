import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Truck, Edit, Trash2, X, Save, AlertCircle, ChevronDown } from 'lucide-react';
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
  onAddMarcaAsync: (marcaNombre: string) => Promise<Marca>;
  onAddModeloAsync: (modeloData: Omit<Modelo, 'id'>) => Promise<Modelo>;
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
  onAddMarcaAsync,
  onAddModeloAsync,
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

  // Estados de texto para los inputs
  const [clienteInput, setClienteInput] = useState('');
  const [tipoInput, setTipoInput] = useState('');
  const [marcaInput, setMarcaInput] = useState('');
  const [modeloInput, setModeloInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estados de control de visibilidad de los dropdowns flotantes
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);
  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);
  const [showModeloDropdown, setShowModeloDropdown] = useState(false);

  // Referencias DOM para detectar clics exteriores
  const clienteRef = useRef<HTMLDivElement>(null);
  const tipoRef = useRef<HTMLDivElement>(null);
  const marcaRef = useRef<HTMLDivElement>(null);
  const modeloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

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
      setClienteInput('');
      setTipoInput('');
      setMarcaInput('');
      setModeloInput('');
      setErrors({});
    } else if (equipo) {
      setMode('view');
      
      const cId = String(equipo.clienteId || (equipo as any).id_cliente || '');
      const tId = String(equipo.tipoEquipoId || (equipo as any).id_tipo_equipo || '');
      const mId = String(equipo.marcaId || (equipo as any).id_marca || '');
      const moId = String(equipo.modeloId || (equipo as any).id_modelo || '');

      setFormData({
        clienteId: cId,
        tipoEquipoId: tId,
        marcaId: mId,
        modeloId: moId,
        aliasInterno: equipo.aliasInterno || '',
        observacion: equipo.observacion || '',
        serial: equipo.serial || '',
        infoTecnica: equipo.infoTecnica || '',
      });

      const cli = clientes.find(c => String(c.id || (c as any).id_cliente) === cId);
      const tip = tiposEquipo.find(t => String(t.id || (t as any).id_tipo_equipo) === tId);
      const mar = marcasList.find(m => String(m.id || (m as any).id_marca) === mId);
      const mod = modelosList.find(m => String(m.id || (m as any).id_modelo) === moId);

      setClienteInput(cli?.razonSocial || (cli as any)?.razon_social || '');
      setTipoInput(tip?.tipoNombre || (tip as any)?.tipo_nombre || '');
      setMarcaInput(mar?.marcaNombre || (equipo as any).marcaNombre || '');
      setModeloInput(mod?.nombre || (equipo as any).nombre || '');
      setErrors({});
    }
  }, [equipo, isCreating, isOpen, clientes, tiposEquipo, marcasList, modelosList]);

  // Manejador global de clicks externos para cerrar listas flotantes
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clienteRef.current && !clienteRef.current.contains(event.target as Node)) {
        setShowClienteDropdown(false);
      }
      if (tipoRef.current && !tipoRef.current.contains(event.target as Node)) {
        setShowTipoDropdown(false);
      }
      if (marcaRef.current && !marcaRef.current.contains(event.target as Node)) {
        setShowMarcaDropdown(false);
      }
      if (modeloRef.current && !modeloRef.current.contains(event.target as Node)) {
        setShowModeloDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de filtrado de Modelos según Marca y Tipo elegidos
  const modelosDisponibles = useMemo(() => {
    return modelosList.filter(m => {
      const mId = String(m.marcaId || (m as any).id_marca || '');
      const tId = String(m.tipoEquipoId || (m as any).id_tipo_equipo || '');
      return mId === String(formData.marcaId) && tId === String(formData.tipoEquipoId);
    });
  }, [modelosList, formData.marcaId, formData.tipoEquipoId]);

  // CONTROLADORES DE CLIENTE
  const handleClienteInputChange = (value: string) => {
    setClienteInput(value);
    const cli = clientes.find(c => (c.razonSocial || (c as any).razon_social || '').toLowerCase() === value.toLowerCase());
    if (cli) {
      setFormData(prev => ({ ...prev, clienteId: String(cli.id || (cli as any).id_cliente) }));
    } else {
      setFormData(prev => ({ ...prev, clienteId: '' }));
    }
  };

  // CONTROLADORES DE TIPO DE EQUIPO
  const handleTipoInputChange = (value: string) => {
    setTipoInput(value);
    const tip = tiposEquipo.find(t => (t.tipoNombre || (t as any).tipo_nombre || '').toLowerCase() === value.toLowerCase());
    if (tip) {
      setFormData(prev => ({ ...prev, tipoEquipoId: String(tip.id || (tip as any).id_tipo_equipo), modeloId: '' }));
      setModeloInput('');
    } else {
      setFormData(prev => ({ ...prev, tipoEquipoId: '', modeloId: '' }));
      setModeloInput('');
    }
  };

  // CONTROLADORES DE MARCA
  const handleMarcaInputChange = (value: string) => {
    setMarcaInput(value);
    const marca = marcasList.find(m => m.marcaNombre.toLowerCase() === value.toLowerCase());
    if (marca) {
      const idReal = String(marca.id || (marca as any).id_marca);
      setFormData(prev => ({ ...prev, marcaId: idReal, modeloId: '' }));
      setModeloInput('');
    } else {
      setFormData(prev => ({ ...prev, marcaId: '', modeloId: '' }));
      setModeloInput('');
    }
  };

  const handleMarcaInputBlur = () => {
    setTimeout(() => {
      if (marcaInput && !formData.marcaId) {
        const exists = marcasList.some(m => m.marcaNombre.toLowerCase() === marcaInput.toLowerCase());
        if (!exists) {
          setNewMarcaName(marcaInput);
          setShowMarcaDialog(true);
        }
      }
    }, 180);
  };

  const handleCreateMarca = async () => {
    if (!newMarcaName.trim()) return;
    try {
      const marcaGuardada = await onAddMarcaAsync({ marcaNombre: newMarcaName } as any);
      const idReal = String(marcaGuardada.id || (marcaGuardada as any).id_marca);
      
      setFormData(prev => ({ ...prev, marcaId: idReal }));
      setMarcaInput(marcaGuardada.marcaNombre || (marcaGuardada as any).marca_nombre || newMarcaName);
      
      setShowMarcaDialog(false);
      setNewMarcaName('');
      toast.success(`Marca "${marcaGuardada.marcaNombre || newMarcaName}" creada exitosamente`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al intentar guardar la marca.');
    }
  };

  // CONTROLADORES DE MODELO
  const handleModeloInputChange = (value: string) => {
    setModeloInput(value);
    const modelo = modelosDisponibles.find(m => m.nombre.toLowerCase() === value.toLowerCase());
    if (modelo) {
      const idReal = String(modelo.id || (modelo as any).id_modelo);
      setFormData(prev => ({ ...prev, modeloId: idReal }));
    } else {
      setFormData(prev => ({ ...prev, modeloId: '' }));
    }
  };

  const handleModeloInputBlur = () => {
    setTimeout(() => {
      if (modeloInput && !formData.modeloId && formData.marcaId && formData.tipoEquipoId) {
        const exists = modelosDisponibles.some(m => m.nombre.toLowerCase() === modeloInput.toLowerCase());
        if (!exists) {
          setNewModeloName(modeloInput);
          setShowModeloDialog(true);
        }
      }
    }, 180);
  };

  const handleCreateModelo = async () => {
    try {
      if (!formData.marcaId || !formData.tipoEquipoId) {
        toast.error('Debe seleccionar una Marca y un Tipo de equipo antes de registrar un modelo.');
        return;
      }

      const nombreMarca = marcasList.find(m => String(m.id || (m as any).id_marca) === String(formData.marcaId))?.marcaNombre || 'Sin Marca';
      const nombreTipo = tiposEquipo.find(t => String(t.id || (t as any).id_tipo_equipo) === String(formData.tipoEquipoId))?.tipoNombre || 'Sin Tipo';

      const nuevoModeloPayload: Omit<Modelo, 'id'> = {
        nombre: newModeloName,
        marcaId: formData.marcaId,
        tipoEquipoId: formData.tipoEquipoId,
        anoVersion: '',
        numeroSerie: '',
        infoTecnica: 'Registrado express desde asignación de equipo',
        enlaceFichaTecnica: '',
        marcaNombre: nombreMarca, 
        tipoNombre: nombreTipo   
      };
      
      const modeloGuardado = await onAddModeloAsync(nuevoModeloPayload);
      const idReal = String(modeloGuardado.id || (modeloGuardado as any).id_modelo);
      
      setFormData(prev => ({ ...prev, modeloId: idReal }));
      setModeloInput(modeloGuardado.nombre);
      
      setShowModeloDialog(false);
      setNewModeloName('');
      toast.success(`Modelo "${modeloGuardado.nombre}" creado exitosamente`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al intentar guardar el modelo.');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clienteId) newErrors.clienteId = 'El cliente es requerido y debe seleccionarse de la lista';
    if (!formData.tipoEquipoId) newErrors.tipoEquipoId = 'El tipo de equipo es requerido y debe seleccionarse de la lista';
    if (!formData.marcaId) newErrors.marcaId = 'La marca es requerida';
    if (!formData.modeloId) newErrors.modeloId = 'El modelo es requerido';
    if (!formData.aliasInterno.trim()) newErrors.aliasInterno = 'El alias interno es requerido';
    if (!formData.serial.trim()) {
      newErrors.serial = 'El serial es requerido';
    } else {
      const isDuplicate = allEquipos.some(e =>
        e.serial === formData.serial &&
        String(e.marcaId || (e as any).id_marca) === String(formData.marcaId) &&
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
      const idAEliminar = equipo.id || (equipo as any).id_equipo;
      onDelete(idAEliminar);
      toast.success('Equipo eliminado exitosamente');
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      onClose();
    } else {
      setMode('view');
      if (equipo) {
        const cId = String(equipo.clienteId || (equipo as any).id_cliente || '');
        const tId = String(equipo.tipoEquipoId || (equipo as any).id_tipo_equipo || '');
        const mId = String(equipo.marcaId || (equipo as any).id_marca || '');
        const moId = String(equipo.modeloId || (equipo as any).id_modelo || '');

        setFormData({
          clienteId: cId,
          tipoEquipoId: tId,
          marcaId: mId,
          modeloId: moId,
          aliasInterno: equipo.aliasInterno || '',
          observacion: equipo.observacion || '',
          serial: equipo.serial || '',
          infoTecnica: equipo.infoTecnica || '',
        });
        const cliObj = clientes.find(c => String(c.id || (c as any).id_cliente) === cId);
        const tipObj = tiposEquipo.find(t => String(t.id || (t as any).id_tipo_equipo) === tId);
        const marObj = marcasList.find(m => String(m.id || (m as any).id_marca) === mId);
        const modObj = modelosList.find(m => String(m.id || (m as any).id_modelo) === moId);
        
        setClienteInput(cliObj?.razonSocial || (cliObj as any)?.razon_social || '');
        setTipoInput(tipObj?.tipoNombre || (tipObj as any)?.tipo_nombre || '');
        setMarcaInput(marObj?.marcaNombre || '');
        setModeloInput(modObj?.nombre || '');
      }
      setErrors({});
    }
  };

  // Listas filtradas reactivamente según lo que tipea el usuario
  const filteredClientes = clientes.filter(c =>
    (c?.razonSocial || (c as any)?.razon_social || '').toLowerCase().includes((clienteInput || '').toLowerCase())
  );

  const filteredTipos = tiposEquipo.filter(t =>
    (t?.tipoNombre || (t as any)?.tipo_nombre || '').toLowerCase().includes((tipoInput || '').toLowerCase())
  );

  const filteredMarcas = marcasList.filter(m =>
    (m?.marcaNombre || '').toLowerCase().includes((marcaInput || '').toLowerCase())
  );

  const filteredModelos = modelosDisponibles.filter(m =>
    (m?.nombre || '').toLowerCase().includes((modeloInput || '').toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-visible">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#FF6B35]" />
              {isCreating ? 'Registrar Nuevo Equipo' : mode === 'view' ? 'Detalles del Equipo' : 'Editar Equipo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-visible">
            {mode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cliente</p>
                    <p className="font-medium">{clienteInput || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Alias Interno</p>
                    <p className="font-medium">{formData.aliasInterno}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo de Equipo</p>
                    <p className="font-medium">{tipoInput || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Marca</p>
                    <p className="font-medium">{marcaInput || 'Sin Marca'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Modelo</p>
                    <p className="font-medium">{modeloInput || 'Sin Modelo'}</p>
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
              <div className="space-y-4 overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
                  
                  {/* INPUT TIPEABLE PROFESIONAL: CLIENTES */}
                  <div className="md:col-span-2 relative" ref={clienteRef}>
                    <Label htmlFor="cliente">Cliente *</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="cliente"
                        value={clienteInput}
                        onChange={(e) => handleClienteInputChange(e.target.value)}
                        onFocus={() => {
                          setShowClienteDropdown(true);
                          setShowTipoDropdown(false);
                          setShowMarcaDropdown(false);
                          setShowModeloDropdown(false);
                        }}
                        placeholder="Escriba para buscar cliente..."
                        className={errors.clienteId ? 'border-red-500 pr-8 bg-gray-50/50' : 'pr-8 bg-gray-50/50'}
                      />
                      <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showClienteDropdown && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1">
                        {filteredClientes.length > 0 ? (
                          filteredClientes.map(c => {
                            const idReal = String(c.id || (c as any).id_cliente);
                            const nombreReal = c.razonSocial || (c as any).razon_social;
                            return (
                              <div
                                key={idReal}
                                className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 text-sm font-normal text-gray-900 transition-colors"
                                onMouseDown={() => {
                                  setClienteInput(nombreReal);
                                  setFormData(prev => ({ ...prev, clienteId: idReal }));
                                  setShowClienteDropdown(false);
                                }}
                              >
                                {nombreReal}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-gray-400 italic text-center">No se encontraron clientes</div>
                        )}
                      </div>
                    )}
                    {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
                  </div>

                  {/* INPUT TIPEABLE PROFESIONAL: TIPO DE EQUIPO */}
                  <div className="relative" ref={tipoRef}>
                    <Label htmlFor="tipoEquipo">Tipo de Equipo *</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="tipoEquipo"
                        value={tipoInput}
                        onChange={(e) => handleTipoInputChange(e.target.value)}
                        onFocus={() => {
                          setShowTipoDropdown(true);
                          setShowClienteDropdown(false);
                          setShowMarcaDropdown(false);
                          setShowModeloDropdown(false);
                        }}
                        placeholder="Escriba para buscar tipo..."
                        className={errors.tipoEquipoId ? 'border-red-500 pr-8 bg-gray-50/50' : 'pr-8 bg-gray-50/50'}
                      />
                      <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showTipoDropdown && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1">
                        {filteredTipos.length > 0 ? (
                          filteredTipos.map(t => {
                            const idReal = String(t.id || (t as any).id_tipo_equipo);
                            const nombreReal = t.tipoNombre || (t as any).tipo_nombre;
                            return (
                              <div
                                key={idReal}
                                className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 text-sm font-normal text-gray-900 transition-colors"
                                onMouseDown={() => {
                                  setTipoInput(nombreReal);
                                  setFormData(prev => ({ ...prev, tipoEquipoId: idReal, modeloId: '' }));
                                  setModeloInput('');
                                  setShowTipoDropdown(false);
                                }}
                              >
                                {nombreReal}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-gray-400 italic text-center">No se encontraron tipos</div>
                        )}
                      </div>
                    )}
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

                  {/* INPUT TIPEABLE PROFESIONAL: MARCA */}
                  <div className="relative" ref={marcaRef}>
                    <Label htmlFor="marca">Marca *</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="marca"
                        value={marcaInput}
                        onChange={(e) => handleMarcaInputChange(e.target.value)}
                        onBlur={handleMarcaInputBlur}
                        onFocus={() => {
                          setShowMarcaDropdown(true);
                          setShowClienteDropdown(false);
                          setShowTipoDropdown(false);
                          setShowModeloDropdown(false);
                        }}
                        placeholder="Escriba o seleccione"
                        className={errors.marcaId ? 'border-red-500 pr-8 bg-gray-50/50' : 'pr-8 bg-gray-50/50'}
                      />
                      <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showMarcaDropdown && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1">
                        {filteredMarcas.length > 0 ? (
                          filteredMarcas.map(m => {
                            const idReal = String(m.id || (m as any).id_marca);
                            return (
                              <div
                                key={idReal}
                                className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 text-sm font-normal text-gray-900 transition-colors"
                                onMouseDown={() => {
                                  setMarcaInput(m.marcaNombre);
                                  setFormData(prev => ({ ...prev, marcaId: idReal, modeloId: '' }));
                                  setModeloInput('');
                                  setShowMarcaDropdown(false);
                                }}
                              >
                                {m.marcaNombre}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-gray-400 italic text-center">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
                    {errors.marcaId && <p className="text-xs text-red-500 mt-1">{errors.marcaId}</p>}
                  </div>

                  {/* INPUT TIPEABLE PROFESIONAL: MODELO */}
                  <div className="relative" ref={modeloRef}>
                    <Label htmlFor="modelo">Modelo *</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="modelo"
                        value={modeloInput}
                        onChange={(e) => handleModeloInputChange(e.target.value)}
                        onBlur={handleModeloInputBlur}
                        onFocus={() => {
                          if (formData.marcaId && formData.tipoEquipoId) {
                            setShowModeloDropdown(true);
                            setShowClienteDropdown(false);
                            setShowTipoDropdown(false);
                            setShowMarcaDropdown(false);
                          }
                        }}
                        placeholder={formData.marcaId && formData.tipoEquipoId ? "Escriba o seleccione" : "Primero seleccione Tipo y Marca"}
                        disabled={!formData.marcaId || !formData.tipoEquipoId}
                        className={errors.modeloId ? 'border-red-500 pr-8 bg-gray-50/50' : 'pr-8 bg-gray-50/50'}
                      />
                      <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showModeloDropdown && formData.marcaId && formData.tipoEquipoId && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1">
                        {filteredModelos.length > 0 ? (
                          filteredModelos.map(m => {
                            const idReal = String(m.id || (m as any).id_modelo);
                            return (
                              <div
                                key={idReal}
                                className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 text-sm font-normal text-gray-900 transition-colors"
                                onMouseDown={() => {
                                  setModeloInput(m.nombre);
                                  setFormData(prev => ({ ...prev, modeloId: idReal }));
                                  setShowModeloDropdown(false);
                                }}
                              >
                                {m.nombre}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-gray-400 italic text-center">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
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
            <AlertDialogCancel onClick={() => { setMarcaInput(''); setFormData(prev => ({ ...prev, marcaId: '' })); }}>Cancelar</AlertDialogCancel>
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
            <AlertDialogCancel onClick={() => { setModeloInput(''); setFormData(prev => ({ ...prev, modeloId: '' })); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateModelo} className="bg-[#0066CC] hover:bg-[#0052A3]">
              Crear Modelo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}