'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { FiniquitoContent } from '@/templates/finiquito';

interface FiniquitoPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  content: FiniquitoContent | null;
}

// Componente para renderizar texto con negritas usando **markdown**
const BoldableText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part.length > 0);
  return (
    <>
      {parts.map((part, index) => 
        part.startsWith('**') && part.endsWith('**') ? 
        <strong key={index}>{part.slice(2, -2)}</strong> : 
        <React.Fragment key={index}>{part}</React.Fragment>
      )}
    </>
  );
};

const DetailRow = ({ label, value, isBold = false }: { label: string; value: string; isBold?: boolean }) => (
  <div className={`flex justify-between py-1.5 text-gray-800 ${isBold ? 'font-bold' : ''}`}>
    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-sm text-right ${isBold ? 'text-gray-900' : 'text-gray-800'}`}>{value}</p>
  </div>
);

export function FiniquitoPreview({ isOpen, onClose, content }: FiniquitoPreviewProps) {
  if (!content) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa del Finiquito</DialogTitle>
          <DialogDescription>
            Este es el documento final del finiquito. Revisa que todos los datos sean correctos antes de generarlo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-6 bg-gray-50 rounded-md border">
          <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm text-gray-800">
            
            <h1 className="text-xl font-bold text-center mb-8 text-gray-900">{content.title}</h1>

            <p className="text-sm leading-relaxed mb-6">
              <BoldableText text={content.comparecencia} />
            </p>

            {/* Renderiza todas las cláusulas, incluyendo la liquidación en el orden correcto */}
            {content.clausulas.map((clausula, index) => (
              <div key={index} className="mb-4">
                <h2 className="text-md font-bold mb-2 text-gray-900">{clausula.titulo}</h2>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  <BoldableText text={clausula.contenido} />
                </p>

                {/* Si es la cláusula de liquidación, renderiza la tabla */}
                {clausula.titulo.includes('LIQUIDACIÓN') && (
                    <div className="mt-4 border-t border-b py-4">
                        <h3 className="text-md font-semibold mb-3 text-gray-900">-- HABERES --</h3>
                        {content.liquidacion.haberes.map((item, i) => <DetailRow key={`h-${i}`} label={item.label} value={item.value} />)}
                        <div className="border-t my-2"></div>
                        <DetailRow label="TOTAL HABERES" value={content.liquidacion.totalHaberes} isBold />
                        
                        {content.liquidacion.descuentos.length > 0 && (
                            <>
                                <h3 className="text-md font-semibold mt-6 mb-3 text-gray-900">-- DESCUENTOS --</h3>
                                {content.liquidacion.descuentos.map((item, i) => <DetailRow key={`d-${i}`} label={item.label} value={item.value} />)}
                                <div className="border-t my-2"></div>
                                <DetailRow label="TOTAL DESCUENTOS" value={content.liquidacion.totalDescuentos} isBold />
                            </>
                        )}

                        <div className="border-t-2 border-black my-4"></div>
                        <DetailRow label={content.liquidacion.totalAPagar.label} value={content.liquidacion.totalAPagar.value} isBold />
                    </div>
                )}
              </div>
            ))}

            {/* Firmas */}
            <div className="mt-24 grid grid-cols-2 gap-20">
              <div className="text-center">
                <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                <p className="text-sm font-semibold text-gray-900 break-words">{content.firmas.trabajador.nombre}</p>
                <p className="text-sm">RUT: {content.firmas.trabajador.rut}</p>
              </div>
              <div className="text-center">
                <div className="border-t border-black w-3/4 mx-auto mb-2"></div>
                <p className="text-sm font-semibold text-gray-900 break-words">{content.firmas.empleador.nombre}</p>
                <p className="text-sm">RUT: {content.firmas.empleador.rut}</p>
              </div>
            </div>

          </div>
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
