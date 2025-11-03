'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { EconomicIndicator, Company } from '@/lib/types';

interface CompanySpecificCardProps {
  selectedCompany: Company | null;
  indicator: Partial<EconomicIndicator> | null;
  isLoading: boolean;
  isCompanySpecific: boolean;
  year: number;
  month: number;
  handleFieldChange: (field: keyof EconomicIndicator, value: string) => void;
  handleSaveCompanySpecific: () => void;
}

export function CompanySpecificCard({
  selectedCompany,
  indicator,
  isLoading,
  isCompanySpecific,
  year,
  month,
  handleFieldChange,
  handleSaveCompanySpecific,
}: CompanySpecificCardProps) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Valores Específicos por Empresa</CardTitle>
        <CardDescription>
          Define valores que sobreescriban el indicador global solo para <span className="font-bold">{selectedCompany?.name || 'la empresa seleccionada'}</span> en el período de <span className="font-bold">{format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={cn("rounded-md border p-4", isCompanySpecific ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-dashed")}>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="uf">Valor UF (Personalizado)</Label>
              <Input
                id="uf"
                type="number"
                placeholder={indicator?.uf === undefined ? "Sin datos" : "Ingresa el valor"}
                value={indicator?.uf ?? ''}
                onChange={e => handleFieldChange('uf', e.target.value)}
                disabled={!selectedCompany || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm">Valor UTM (Personalizado)</Label>
              <Input
                id="utm"
                type="number"
                placeholder={indicator?.utm === undefined ? "Sin datos" : "Ingresa el valor"}
                value={indicator?.utm ?? ''}
                onChange={e => handleFieldChange('utm', e.target.value)}
                disabled={!selectedCompany || isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sueldo-minimo">Sueldo Mínimo (Personalizado)</Label>
              <Input
                id="sueldo-minimo"
                type="number"
                placeholder={indicator?.minWage === undefined ? "Sin datos" : "Ingresa el valor"}
                value={indicator?.minWage ?? ''}
                onChange={e => handleFieldChange('minWage', e.target.value)}
                disabled={!selectedCompany || isLoading}
              />
            </div>
          </div>
          {isCompanySpecific && (
            <p className="text-sm text-blue-600 mt-3">
              Estás viendo valores personalizados para <span className="font-bold">{selectedCompany?.name}</span>.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-4">
        <Button disabled={isLoading || !selectedCompany} onClick={handleSaveCompanySpecific}>
          Guardar para {selectedCompany?.name || '...'}
        </Button>
      </CardFooter>
    </Card>
  );
}
