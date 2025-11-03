'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EconomicIndicator } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EditIndicatorDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  indicator: Partial<EconomicIndicator>;
  onSave: (updatedIndicator: Partial<EconomicIndicator>) => void;
  isLoading: boolean;
}

export function EditIndicatorDialog({ isOpen, onOpenChange, indicator, onSave, isLoading }: EditIndicatorDialogProps) {
  const [editedData, setEditedData] = React.useState<Partial<EconomicIndicator>>(indicator);

  React.useEffect(() => {
    setEditedData(indicator);
  }, [indicator]);

  const handleFieldChange = (field: keyof EconomicIndicator, value: string | number) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    if (editedData) {
      onSave(editedData);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Modificar Indicador Económico</AlertDialogTitle>
          <AlertDialogDescription>
            Edita los valores para el período de {format(new Date(indicator?.year || new Date().getFullYear(), (indicator?.month || 1) - 1), 'MMMM yyyy', { locale: es })}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-uf" className="text-right">Valor UF</Label>
            <Input
              id="edit-uf"
              type="number"
              value={editedData?.uf ?? ''}
              onChange={e => handleFieldChange('uf', parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-utm" className="text-right">Valor UTM</Label>
            <Input
              id="edit-utm"
              type="number"
              value={editedData?.utm ?? ''}
              onChange={e => handleFieldChange('utm', parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-minWage" className="text-right">Sueldo Mínimo</Label>
            <Input
              id="edit-minWage"
              type="number"
              value={editedData?.minWage ?? ''}
              onChange={e => handleFieldChange('minWage', parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSaveClick} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
