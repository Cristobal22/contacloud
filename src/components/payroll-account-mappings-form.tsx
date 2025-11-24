'use client';

import React from 'react';
import type { Company, Account, PayrollAccountMappings } from '@/lib/types';
import { AccountSearchInput } from './account-search-input';
import { Label } from './ui/label';

interface PayrollAccountMappingsFormProps {
  company: Partial<Company>;
  accounts: Account[];
  loading: boolean;
  onMappingChange: (field: keyof PayrollAccountMappings, value: string) => void;
}

export const PayrollAccountMappingsForm: React.FC<PayrollAccountMappingsFormProps> = ({ 
    company, 
    accounts, 
    loading, 
    onMappingChange 
}) => {

  const mappings = company.payrollAccountMappings || {};

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h4 className="text-md font-medium">Cuentas de Gasto (Haberes)</h4>
        <p className="text-sm text-muted-foreground">Asigna las cuentas de resultado donde se registrarán los costos de cada concepto.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <AccountSearchInput 
                label="Gasto - Sueldo Base"
                value={mappings.expense_baseSalary || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_baseSalary', value)}
            />
            <AccountSearchInput 
                label="Gasto - Gratificación"
                value={mappings.expense_gratification || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_gratification', value)}
            />
            <AccountSearchInput 
                label="Gasto - Horas Extra"
                value={mappings.expense_overtime || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_overtime', value)}
            />
            <AccountSearchInput 
                label="Gasto - Bonos y Comisiones"
                value={mappings.expense_bonuses || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_bonuses', value)}
            />
            <AccountSearchInput 
                label="Gasto - Movilización"
                value={mappings.expense_transportation || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_transportation', value)}
            />
            <AccountSearchInput 
                label="Gasto - Colación"
                value={mappings.expense_mealAllowance || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_mealAllowance', value)}
            />
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium">Cuentas de Pasivo (Descuentos y Obligaciones)</h4>
         <p className="text-sm text-muted-foreground">Asigna las cuentas de pasivo para las deudas y retenciones.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <AccountSearchInput 
                label="Pasivo - Cotización AFP por Pagar"
                value={mappings.liability_afp || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('liability_afp', value)}
            />
            <AccountSearchInput 
                label="Pasivo - Cotización Salud por Pagar"
                value={mappings.liability_health || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('liability_health', value)}
            />
            <AccountSearchInput 
                label="Pasivo - Seguro Cesantía por Pagar"
                value={mappings.liability_unemployment || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('liability_unemployment', value)}
            />
            <AccountSearchInput 
                label="Pasivo - Impuesto Único por Pagar"
                value={mappings.liability_tax || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('liability_tax', value)}
            />
            <AccountSearchInput 
                label="Pasivo - Anticipos a Personal"
                value={mappings.liability_advances || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('liability_advances', value)}
            />
             <AccountSearchInput 
                label="Pasivo - Préstamos CCAF por Pagar"
                value={mappings.liability_ccaf || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('liability_ccaf', value)}
            />
        </div>
      </div>

       <div>
        <h4 className="text-md font-medium">Cuentas de Gasto (Aportes del Empleador)</h4>
        <p className="text-sm text-muted-foreground">Asigna las cuentas de resultado para los costos del empleador.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <AccountSearchInput 
                label="Gasto - Aporte SIS (Seguro Invalidez)"
                value={mappings.expense_sis || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_sis', value)}
            />
            <AccountSearchInput 
                label="Gasto - Aporte Seguro Cesantía"
                value={mappings.expense_unemployment || ''}
                accounts={accounts}
                loading={loading}
                onValueChange={(value) => onMappingChange('expense_unemployment', value)}
            />
        </div>
      </div>

    </div>
  );
};
