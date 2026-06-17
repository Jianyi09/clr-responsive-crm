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

// Definición de propiedades estrictas que el componente padre debe inyectar
interface ModeloModalProps {
  isOpen: boolean; // Flag que controla la visibilidad física del cuadro de diálogo
  onClose: () => void; // Función callback para abortar y cerrar el modal
  modelo: Modelo | null; // El objeto con los datos del modelo activo (null si es nuevo)
  isCreating: boolean; // Flag para forzar comportamiento de formulario vacío
  onSave: (modeloData: Omit<Modelo, 'id'>) => void; // Callback del canal de persistencia
  onDelete: (id: string) => void; // Callback para disparar eventos DELETE
  allModelos: Modelo[]; // Listado total de modelos (útil para auditoría o validaciones cruzadas)
  marcasList: Marca[]; // Colección maestro traída de la tabla "Marcas_Equipos"
  tiposEquipo: TipoEquipo[]; // Colección maestro traída de la tabla "Tipos_Equipos"
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
  const { isAdmin } = useAuth(); // Valida permisos del rol para ocultar/mostrar botones CRUD
  const [mode, setMode] = useState<'view' | 'edit'>('view'); // Controla si renderiza etiquetas de lectura o inputs de formulario
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // Bandera para activar la ventana de confirmación destructiva

  // Estructura interna del formulario que emula exactamente las columnas de la tabla base "Modelos_Equipos"
  const [formData, setFormData] = useState({
    nombre: '',
    marcaId: '',
    tipoEquipoId: '',
    anoVersion: '',
    numeroSerie: '',
    infoTecnica: '',
    enlaceFichaTecnica: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({}); // Almacena mensajes de validación por campo

  // ====================================================
  // EFECTO SENSE: Sincroniza el formulario al abrir/cambiar entidad
  // ====================================================
  useEffect(() => {
    if (isCreating) {
      setMode('edit'); // Fuerza el formulario editable si el usuario desea registrar un modelo nuevo
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
      setMode('view'); // Por defecto, si el modelo existe, abre en formato de ficha de lectura limpia
      setFormData({
        nombre: modelo.nombre || '',
        // COMPORTAMIENTO PUENTE: Tolera tanto los alias tipados de JS (marcaId) como los crudos de la BD (id_marca)
        marcaId: String((modelo as any).id_marca || modelo.marcaId || ''),
        tipoEquipoId: String((modelo as any).id_tipo_equipo || modelo.tipoEquipoId || ''),
        anoVersion: modelo.anoVersion || '',
        numeroSerie: modelo.numeroSerie || '',
        infoTecnica: modelo.infoTecnica || '',
        enlaceFichaTecnica: modelo.enlaceFichaTecnica || '',
      });
      setErrors({});
    }
  }, [modelo, isCreating, isOpen]);

  // ====================================================
  // VALIDACIONES DE INTEGRIDAD DE DATOS (FRONTEND)
  // ====================================================
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre del modelo es requerido';
    if (!formData.marcaId) newErrors.marcaId = 'La marca es requerida';
    if (!formData.tipoEquipoId) newErrors.tipoEquipoId = 'El tipo de equipo es requerido';
    if (!formData.numeroSerie.trim()) newErrors.numeroSerie = 'El número de serie es requerido';

    // Validación sintáctica de la URL de fichas técnicas para evitar rupturas de hipervínculos
    if (formData.enlaceFichaTecnica && formData.enlaceFichaTecnica.trim()) {
      try {
        new URL(formData.enlaceFichaTecnica);
      } catch {
        newErrors.enlaceFichaTecnica = 'La URL no es válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true si el formulario está completamente limpio
  };

  // Dispara el callback de guardado si las validaciones frontend concluyen con éxito
  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }

    // 1. Buscamos los nombres correspondientes a los IDs seleccionados
    const nombreMarca = marcasList.find(m => String((m as any).id_marca || m.id) === String(formData.marcaId))?.marcaNombre || 'Sin Marca';
    const nombreTipo = tiposEquipo.find(t => String((t as any).id_tipo_equipo || t.id) === String(formData.tipoEquipoId))?.tipoNombre || 'Sin Tipo';

    // 2. Pasamos el objeto estructurado con las propiedades requeridas por el tipo Modelo (Omit<Modelo, 'id'>)
    onSave({
      nombre: formData.nombre,
      marcaId: formData.marcaId,
      tipoEquipoId: formData.tipoEquipoId,
      anoVersion: formData.anoVersion,
      numeroSerie: formData.numeroSerie,
      infoTecnica: formData.infoTecnica,
      enlaceFichaTecnica: formData.enlaceFichaTecnica,
      marcaNombre: nombreMarca,  // <-- Propiedad faltante añadida
      tipoNombre: nombreTipo     // <-- Propiedad faltante añadida
    });
    
    toast.success(isCreating ? 'Modelo creado exitosamente' : 'Modelo actualizado exitosamente');
  };

  // Gestiona de forma segura el identificador real a enviar al controlador DELETE del backend
  const handleDelete = () => {
    if (modelo) {
      const idAEliminar = (modelo as any).id_modelo || modelo.id;
      onDelete(idAEliminar);
      toast.success('Modelo eliminado exitosamente');
    }
  };

  // Manejador del botón cancelar: revierte los cambios hechos y regresa a la vista lectura sin mutar estados externos
  const handleCancel = () => {
    if (isCreating) {
      onClose();
    } else {
      setMode('view');
      if (modelo) {
        setFormData({
          nombre: modelo.nombre || '',
          marcaId: String((modelo as any).id_marca || modelo.marcaId || ''),
          tipoEquipoId: String((modelo as any).id_tipo_equipo || modelo.tipoEquipoId || ''),
          anoVersion: modelo.anoVersion || '',
          numeroSerie: modelo.numeroSerie || '',
          infoTecnica: modelo.infoTecnica || '',
          enlaceFichaTecnica: modelo.enlaceFichaTecnica || '',
        });
      }
      setErrors({});
    }
  };

  // ====================================================
  // RESOLUCIÓN DE RELACIONES MAESTRAS (BÚSQUEDA CRUZADA)
  // ====================================================
  // Inspecciona de forma segura las listas usando tanto claves unificadas como crudas de PostgreSQL (id_marca / id)
  const marcaSeleccionada = marcasList.find(
    m => String((m as any).id_marca || m.id) === String(formData.marcaId)
  );
  const tipoSeleccionado = tiposEquipo.find(
    t => String((t as any).id_tipo_equipo || t.id) === String(formData.tipoEquipoId)
  );

  return (
    <>
      {/* VENTANA DE DIÁLOGO PRINCIPAL (RADIX UI) */}
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
              /* ====================================================
                 SUB-RENDER 1: VISTA FICHA DE LECTURA DE DETALLES
                 ==================================================== */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-1">Nombre del Modelo</p>
                    <p className="font-medium text-lg">{formData.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Marca</p>
                    <p className="font-medium">{marcaSeleccionada?.marcaNombre || 'Sin Marca'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo de Equipo</p>
                    <p className="font-medium">{tipoSeleccionado?.tipoNombre || 'Sin Tipo'}</p>
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
              /* ====================================================
                 SUB-RENDER 2: FORMULARIO ACTIVO (MODO EDICIÓN / ALTA)
                 ==================================================== */
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

                  {/* SELECT DROPDOWN DE MARCAS MAESTRAS */}
                  <div>
                    <Label htmlFor="marcaId">Marca *</Label>
                    <Select 
                      value={formData.marcaId} 
                      onValueChange={(value) => setFormData({ ...formData, marcaId: value })}
                    >
                      <SelectTrigger className={errors.marcaId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {marcasList.map(m => {
                          // Sincronización estricta extraída de tu EquiposController (id_marca)
                          const idMarcaReal = String((m as any).id_marca || m.id);
                          return (
                            <SelectItem key={idMarcaReal} value={idMarcaReal}>
                              {m.marcaNombre}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.marcaId && <p className="text-xs text-red-500 mt-1">{errors.marcaId}</p>}
                  </div>

                  {/* SELECT DROPDOWN DE TIPOS DE EQUIPO MAESTROS */}
                  <div>
                    <Label htmlFor="tipoEquipoId">Tipo de Equipo *</Label>
                    <Select 
                      value={formData.tipoEquipoId} 
                      onValueChange={(value) => setFormData({ ...formData, tipoEquipoId: value })}
                    >
                      <SelectTrigger className={errors.tipoEquipoId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposEquipo.map(t => {
                          // Sincronización estricta extraída de tu EquiposController (id_tipo_equipo)
                          const idTipoReal = String((t as any).id_tipo_equipo || t.id);
                          return (
                            <SelectItem key={idTipoReal} value={idTipoReal}>
                              {t.tipoNombre}
                            </SelectItem>
                          );
                        })}
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

          {/* BOTONERA DINÁMICA DEL FOOTER DEL COMPONENTE */}
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

      {/* MODAL EMERGENTE SUBORDINADO: Cuadro secundario de confirmación de borrado */}
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