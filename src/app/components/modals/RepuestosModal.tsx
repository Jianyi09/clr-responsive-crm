import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Wrench, Plus } from 'lucide-react';
import { type Repuesto, type RepuestoModelo, type Modelo } from '../../data/mockData';
import { AgregarRepuestoModal } from './AgregarRepuestoModal';


interface RepuestosModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelo: Modelo | null;
  canAdd?: boolean;
  listaRepuestosState: Repuesto[];
  repuestosState: RepuestoModelo[];
  onAddRepuesto: (newLink: RepuestoModelo) => void;
  onAddNewRepuesto: (newRepuesto: Repuesto, newLink: RepuestoModelo) => void;
}

export function RepuestosModal({
  isOpen,
  onClose,
  modelo,
  canAdd = false,
  listaRepuestosState,
  repuestosState,
  onAddRepuesto,
  onAddNewRepuesto,
}: RepuestosModalProps) {
  const [isAgregarOpen, setIsAgregarOpen] = useState(false);

  if (!modelo) return null;

  const nombreMarca = (modelo as any).marca || (modelo as any).marcaNombre || 'Sin Marca';

  const linkedIds = repuestosState
    .filter(rm => String(rm.modeloId) === String(modelo.id))
    .map(rm => String(rm.repuestoId));

  const linkedRepuestos: Repuesto[] = linkedIds
    .map(id => listaRepuestosState.find(r => String(r.id) === String(id)))
    .filter(Boolean) as Repuesto[];

  const handleAddDone = (
    result: { tipo: 'existing'; link: RepuestoModelo } | { tipo: 'new'; repuesto: Repuesto; link: RepuestoModelo }
  ) => {
    setIsAgregarOpen(false);
    setTimeout(() => {
      if (result.tipo === 'existing') {
        onAddRepuesto(result.link);
      } else {
        onAddNewRepuesto(result.repuesto, result.link);
      }
    }, 100);
  };

  return (
    <>
      {/* Modificado: Si AgregarRepuestoModal está abierto, ocultamos este del DOM temporalmente */}
      {!isAgregarOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#0066CC]" />
                <span>Catálogo de Repuestos</span>
              </DialogTitle>
              <div className="mt-1">
                <p className="text-sm text-gray-500">
                  Modelo: <span className="font-semibold text-gray-700">{modelo.nombre}</span>
                  <span className="ml-2 text-gray-400">— {nombreMarca}</span>
                </p>
              </div>
            </DialogHeader>

            {/* Table area */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Lista de Repuestos
                </p>
                {canAdd && (
                  <button
                    onClick={() => setIsAgregarOpen(true)}
                    className="w-8 h-8 rounded-full bg-[#0066CC] hover:bg-[#0052A3] text-white flex items-center justify-center shadow-sm transition-colors"
                    title="Agregar repuesto"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {linkedRepuestos.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                  <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {canAdd
                      ? 'Información de repuestos aún no disponible'
                      : 'Aún sin repuestos registrados en el catálogo de este modelo.'}
                  </p>
                  {!canAdd && (
                    <p className="text-gray-400 text-xs mt-1">
                      Por favor agregue repuestos en la sección de Modelos.
                    </p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide w-10">N°</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Repuesto</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Código / Parte</th>
                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Inf. Técnica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {linkedRepuestos.map((repuesto, idx) => (
                        <tr key={repuesto.id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-3 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-gray-800">{repuesto.nombre}</td>
                          <td className="py-3 px-3">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {repuesto.codigoParte}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-gray-500 text-xs">
                            {repuesto.infoTecnica || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-gray-100 pt-3">
              <span className="text-xs text-gray-400 mr-auto">
                {linkedRepuestos.length} repuesto{linkedRepuestos.length !== 1 ? 's' : ''} registrado{linkedRepuestos.length !== 1 ? 's' : ''}
              </span>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal secundario renderizado de forma aislada */}
      {isAgregarOpen && (
        <AgregarRepuestoModal
          isOpen={isAgregarOpen}
          onClose={() => setIsAgregarOpen(false)}
          modelo={modelo}
          listaRepuestosState={listaRepuestosState}
          alreadyLinkedIds={linkedIds}
          onSave={handleAddDone}
        />
      )}
    </>
  );
}