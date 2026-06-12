import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ChevronDown, Save } from 'lucide-react';
import { type Repuesto, type RepuestoModelo, type Modelo } from '../../data/mockData';
// ELIMINADO: Ya no dependemos de la importación estática de 'marcas'

type SaveResult =
  | { tipo: 'existing'; link: RepuestoModelo }
  | { tipo: 'new'; repuesto: Repuesto; link: RepuestoModelo };

interface AgregarRepuestoModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: Modelo | null;
  listaRepuestosState: Repuesto[];
  alreadyLinkedIds: string[];
  onSave: (result: SaveResult) => void;
}

export function AgregarRepuestoModal({
  isOpen,
  onClose,
  modelo,
  listaRepuestosState,
  alreadyLinkedIds,
  onSave,
}: AgregarRepuestoModalProps) {
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newCodigo, setNewCodigo] = useState('');
  const [newInfoTecnica, setNewInfoTecnica] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedId('');
      setIsDropdownOpen(false);
      setNewNombre('');
      setNewCodigo('');
      setNewInfoTecnica('');
      setErrors({});
    }
  }, [isOpen]);

  if (!modelo) return null;

  // MODIFICADO: Extraemos el nombre de la marca directamente del objeto modelo inyectado
  const nombreMarca = (modelo as any).marca_nombre || (modelo as any).marcaNombre || '';

  // MODIFICADO: Forzamos la comparación de los IDs a String para evitar conflictos de tipos (int vs string)
  const available = listaRepuestosState.filter(
    r => !alreadyLinkedIds.map(String).includes(String(r.id))
  );

  const filteredOptions = available.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.codigoParte.toLowerCase().includes(q)
    );
  });

  // MODIFICADO: Búsqueda segura con casting
  const selectedRepuesto = available.find(r => String(r.id) === String(selectedId));

  const handleSelectOption = (r: Repuesto) => {
    setSelectedId(String(r.id));
    setSearch('');
    setIsDropdownOpen(false);
    setErrors({});
  };

  const handleClearSelection = () => {
    setSelectedId('');
    setSearch('');
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};

    if (selectedId) {
      // MODIFICADO: El ID del link se deja vacío u opcional; la base de datos serializará el ID autoincremental
      const link: RepuestoModelo = {
        id: '', 
        modeloId: modelo.id,
        repuestoId: selectedId,
      };
      onSave({ tipo: 'existing', link });
      return;
    }

    // New repuesto path
    if (!newNombre.trim()) errs.newNombre = 'El nombre del repuesto es requerido.';
    if (!newCodigo.trim()) errs.newCodigo = 'El código / parte es requerido.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // MODIFICADO: Quitamos Date.now(). Deja que la BD maneje la secuencia de IDs de las entidades nuevas
    const newRepuesto: Repuesto = {
      id: '',
      nombre: newNombre.trim(),
      codigoParte: newCodigo.trim(),
      infoTecnica: newInfoTecnica.trim(),
    };
    
    const link: RepuestoModelo = {
      id: '',
      modeloId: modelo.id,
      repuestoId: '', // Tu controlador interceptará esto para asignar el ID del repuesto recién creado
    };
    
    onSave({ tipo: 'new', repuesto: newRepuesto, link });
  };

  const isNewMode = !selectedId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-[#FF6B35]" />
            Registrar Repuesto
          </DialogTitle>
          <div className="text-sm text-gray-500 mt-0.5">
            Registrar repuesto para modelo{' '}
            <span className="font-medium text-gray-700">
              {nombreMarca ? `${nombreMarca} — ` : ''}{modelo.nombre}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Searchable Dropdown */}
          <div>
            <Label className="mb-1.5 block">Busca un repuesto</Label>
            <div className="relative" ref={dropdownRef}>
              {/* Trigger / selected display */}
              {selectedRepuesto ? (
                <div className="flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 bg-white">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{selectedRepuesto.nombre}</span>
                    <span className="text-sm text-gray-400 ml-2">• {selectedRepuesto.codigoParte}</span>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-gray-400 hover:text-gray-600 ml-3"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 bg-white hover:border-gray-400 transition-colors text-left"
                >
                  <span className="text-sm text-gray-400">-- Selecciona un repuesto existente --</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Dropdown panel */}
              {isDropdownOpen && !selectedRepuesto && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                    <Input
                      autoFocus
                      placeholder="Buscar por nombre o código..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="text-sm h-8"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4 px-3">
                        {search ? 'No hay resultados para esa búsqueda.' : 'Todos los repuestos del catálogo ya están agregados.'}
                      </p>
                    ) : (
                      filteredOptions.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectOption(r)}
                          className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <span className="text-sm text-gray-800">{r.nombre}</span>
                          <span className="text-sm text-gray-400 ml-1.5">• {r.codigoParte}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-1.5 italic">
              Si no aparece el repuesto en la lista, agrégalo a continuación.
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">
                {isNewMode ? 'Registrar nuevo repuesto' : 'O registrar uno nuevo'}
              </span>
            </div>
          </div>

          {/* New repuesto form */}
          <div className={`space-y-4 ${!isNewMode ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newNombre" className="mb-1.5 block">
                  Tipo de repuesto {isNewMode && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="newNombre"
                  placeholder="Ej. Filtro de aceite"
                  value={newNombre}
                  onChange={e => { setNewNombre(e.target.value); setErrors(prev => ({ ...prev, newNombre: '' })); }}
                  className={errors.newNombre ? 'border-red-500' : ''}
                  disabled={!isNewMode}
                />
                {errors.newNombre && (
                  <p className="text-xs text-red-500 mt-1">{errors.newNombre}</p>
                )}
              </div>
              <div>
                <Label htmlFor="newCodigo" className="mb-1.5 block">
                  Código / Parte {isNewMode && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="newCodigo"
                  placeholder="Ej. ABC-123"
                  value={newCodigo}
                  onChange={e => { setNewCodigo(e.target.value); setErrors(prev => ({ ...prev, newCodigo: '' })); }}
                  className={errors.newCodigo ? 'border-red-500' : ''}
                  disabled={!isNewMode}
                />
                {errors.newCodigo && (
                  <p className="text-xs text-red-500 mt-1">{errors.newCodigo}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="newInfoTecnica" className="mb-1.5 block">
                Información técnica del repuesto <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="newInfoTecnica"
                placeholder="Descripción técnica, especificaciones, notas..."
                value={newInfoTecnica}
                onChange={e => setNewInfoTecnica(e.target.value)}
                rows={3}
                disabled={!isNewMode}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#FF6B35] hover:bg-[#E5582C] text-white"
          >
            {selectedId ? 'Guardar Repuesto' : 'Registrar Repuesto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}