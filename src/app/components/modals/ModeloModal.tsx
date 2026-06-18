import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Box, Edit, Trash2, X, Save, Link as LinkIcon, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { type Marca, type Modelo, type TipoEquipo } from '../../data/mockData';

interface ModeloModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: Modelo | null;
  isCreating: boolean;
  onSave: (modeloData: Omit<Modelo, 'id'>) => void;
  onDelete: (id: string) => void;
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

  // Estados de control para los dropdowns estilo Shadcn/Radix
  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);
  const [showTipoDropdown, setShowTipoDropdown] = useState(false);
  const [marcaInput, setMarcaInput] = useState('');
  const [tipoInput, setTipoInput] = useState('');

  // Referencias para cerrar al hacer clic fuera
  const marcaRef = useRef<HTMLDivElement>(null);
  const tipoRef = useRef<HTMLDivElement>(null);

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
      setMarcaInput('');
      setTipoInput('');
      setErrors({});
    } else if (modelo) {
      setMode('view');
      
      const mId = String((modelo as any).id_marca || modelo.marcaId || '');
      const tId = String((modelo as any).id_tipo_equipo || modelo.tipoEquipoId || '');

      setFormData({
        nombre: modelo.nombre || '',
        marcaId: mId,
        tipoEquipoId: tId,
        anoVersion: modelo.anoVersion || '',
        numeroSerie: modelo.numeroSerie || '',
        infoTecnica: modelo.infoTecnica || '',
        enlaceFichaTecnica: modelo.enlaceFichaTecnica || '',
      });

      const marcaEncontrada = marcasList.find(m => String((m as any).id_marca || m.id) === mId);
      const tipoEncontrado = tiposEquipo.find(t => String((t as any).id_tipo_equipo || t.id) === tId);

      setMarcaInput(marcaEncontrada?.marcaNombre || modelo.marcaNombre || '');
      setTipoInput(tipoEncontrado?.tipoNombre || modelo.tipoNombre || '');
      setErrors({});
    }
  }, [modelo, isCreating, isOpen, marcasList, tiposEquipo]);

  // Manejador global para cerrar dropdowns al hacer clic fuera de sus contenedores
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (marcaRef.current && !marcaRef.current.contains(event.target as Node)) {
        setShowMarcaDropdown(false);
      }
      if (tipoRef.current && !tipoRef.current.contains(event.target as Node)) {
        setShowTipoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre del modelo es requerido';
    if (!formData.marcaId) newErrors.marcaId = 'La marca es requerida';
    if (!formData.tipoEquipoId) newErrors.tipoEquipoId = 'El tipo de equipo es requerido';
    if (!formData.numeroSerie.trim()) newErrors.numeroSerie = 'El número de serie es requerido';

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
    if (!validateForm()) return;

    const nombreMarca = marcasList.find(m => String((m as any).id_marca || m.id) === String(formData.marcaId))?.marcaNombre || marcaInput;
    const nombreTipo = tiposEquipo.find(t => String((t as any).id_tipo_equipo || t.id) === String(formData.tipoEquipoId))?.tipoNombre || tipoInput;

    onSave({
      nombre: formData.nombre,
      marcaId: formData.marcaId,
      tipoEquipoId: formData.tipoEquipoId,
      anoVersion: formData.anoVersion,
      numeroSerie: formData.numeroSerie,
      infoTecnica: formData.infoTecnica,
      enlaceFichaTecnica: formData.enlaceFichaTecnica,
      marcaNombre: nombreMarca,
      tipoNombre: nombreTipo
    });
  };

  const handleDelete = () => {
    if (modelo) {
      const idAEliminar = modelo.id || (modelo as any).id_modelo;
      onDelete(idAEliminar);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      onClose();
    } else {
      setMode('view');
      if (modelo) {
        const mId = String((modelo as any).id_marca || modelo.marcaId || '');
        const tId = String((modelo as any).id_tipo_equipo || modelo.tipoEquipoId || '');
        setFormData({
          nombre: modelo.nombre || '',
          marcaId: mId,
          tipoEquipoId: tId,
          anoVersion: modelo.anoVersion || '',
          numeroSerie: modelo.numeroSerie || '',
          infoTecnica: modelo.infoTecnica || '',
          enlaceFichaTecnica: modelo.enlaceFichaTecnica || '',
        });
        const marcaEncontrada = marcasList.find(m => String((m as any).id_marca || m.id) === mId);
        const tipoEncontrado = tiposEquipo.find(t => String((t as any).id_tipo_equipo || t.id) === tId);
        setMarcaInput(marcaEncontrada?.marcaNombre || modelo.marcaNombre || '');
        setTipoInput(tipoEncontrado?.tipoNombre || modelo.tipoNombre || '');
      }
      setErrors({});
    }
  };

  const filteredMarcas = marcasList.filter(m =>
    m.marcaNombre.toLowerCase().includes(marcaInput.toLowerCase())
  );

  const filteredTipos = tiposEquipo.filter(t =>
    t.tipoNombre.toLowerCase().includes(tipoInput.toLowerCase())
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        {/* Agregamos overflow-visible al contenedor para permitir que los dropdowns floten libremente */}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-visible">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="w-5 h-5 text-green-600" />
              {isCreating ? 'Registrar Nuevo Modelo' : mode === 'view' ? 'Detalles del Modelo' : 'Editar Modelo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-visible">
            {mode === 'view' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Nombre del Modelo</p>
                    <p className="font-medium text-lg">{formData.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Marca</p>
                    <p className="font-medium">{marcaInput || 'Sin Marca'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo de Equipo</p>
                    <p className="font-medium">{tipoInput || 'Sin Tipo'}</p>
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
              <div className="space-y-4 overflow-visible">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-visible">
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

                  {/* SELECTOR PROFESIONAL DE MARCAS */}
                  <div className="relative" ref={marcaRef}>
                    <Label htmlFor="marca">Marca *</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="marca"
                        value={marcaInput}
                        onChange={(e) => {
                          setMarcaInput(e.target.value);
                          setFormData(prev => ({ ...prev, marcaId: '' }));
                          setShowMarcaDropdown(true);
                        }}
                        onFocus={() => {
                          setShowMarcaDropdown(true);
                          setShowTipoDropdown(false);
                        }}
                        placeholder="Escriba o seleccione"
                        className={errors.marcaId ? 'border-red-500 pr-8 bg-gray-50/50' : 'pr-8 bg-gray-50/50'}
                      />
                      <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showMarcaDropdown && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        {filteredMarcas.length > 0 ? (
                          filteredMarcas.map(m => {
                            const idReal = String((m as any).id_marca || m.id);
                            return (
                              <div
                                key={idReal}
                                className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 text-sm font-normal text-gray-900 transition-colors"
                                onClick={() => {
                                  setMarcaInput(m.marcaNombre);
                                  setFormData(prev => ({ ...prev, marcaId: idReal }));
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

                  {/* SELECTOR PROFESIONAL DE TIPOS DE EQUIPO */}
                  <div className="relative" ref={tipoRef}>
                    <Label htmlFor="tipoEquipo">Tipo de Equipo *</Label>
                    <div className="relative flex items-center">
                      <Input
                        id="tipoEquipo"
                        value={tipoInput}
                        onChange={(e) => {
                          setTipoInput(e.target.value);
                          setFormData(prev => ({ ...prev, tipoEquipoId: '' }));
                          setShowTipoDropdown(true);
                        }}
                        onFocus={() => {
                          setShowTipoDropdown(true);
                          setShowMarcaDropdown(false);
                        }}
                        placeholder="Escriba o seleccione"
                        className={errors.tipoEquipoId ? 'border-red-500 pr-8 bg-gray-50/50' : 'pr-8 bg-gray-50/50'}
                      />
                      <ChevronDown className="absolute right-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    {showTipoDropdown && (
                      <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        {filteredTipos.length > 0 ? (
                          filteredTipos.map(t => {
                            const idReal = String((t as any).id_tipo_equipo || t.id);
                            return (
                              <div
                                key={idReal}
                                className="px-3 py-2.5 cursor-pointer hover:bg-gray-100 text-sm font-normal text-gray-900 transition-colors"
                                onClick={() => {
                                  setTipoInput(t.tipoNombre);
                                  setFormData(prev => ({ ...prev, tipoEquipoId: idReal }));
                                  setShowTipoDropdown(false);
                                }}
                              >
                                {t.tipoNombre}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-3 py-2.5 text-sm text-gray-400 italic text-center">No se encontraron resultados</div>
                        )}
                      </div>
                    )}
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