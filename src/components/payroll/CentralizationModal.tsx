import React, { useState } from 'react';
import { Payroll } from '@/lib/types';

interface CentralizationModalProps {
  payrolls: Payroll[];
  companyId: string;
  onClose: () => void;
  onSuccess: (voucherId: string, status: string) => void;
}

// Basic account mapping for display purposes
const ACCOUNT_NAMES = {
    baseSalary: 'Sueldos y Salarios (Gasto)',
    gratification: 'Gratificación Legal (Gasto)',
    netSalary: 'Remuneraciones por Pagar (Pasivo)',
    leyesSociales: 'Leyes Sociales por Pagar (Pasivo)',
    tax: 'Impuesto Único por Pagar (Pasivo)',
};

export const CentralizationModal: React.FC<CentralizationModalProps> = ({ payrolls, companyId, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate aggregated totals for the summary view
  const totals = payrolls.reduce((acc, p) => {
    acc.baseSalary += p.baseSalary ?? 0;
    acc.gratification += p.gratification ?? 0;
    acc.afpDiscount += p.afpDiscount ?? 0;
    acc.healthDiscount += p.healthDiscount ?? 0;
    acc.unemploymentInsuranceDiscount += p.unemploymentInsuranceDiscount ?? 0;
    acc.iut += p.iut ?? 0;
    acc.netSalary += p.netSalary ?? 0;
    return acc;
  }, { baseSalary: 0, gratification: 0, afpDiscount: 0, healthDiscount: 0, unemploymentInsuranceDiscount: 0, iut: 0, netSalary: 0 });

  const leyesSocialesPorPagar = totals.afpDiscount + totals.healthDiscount + totals.unemploymentInsuranceDiscount;

  const handleCentralize = async (status: 'Borrador' | 'Contabilizado') => {
    setIsLoading(true);
    setError(null);

    try {
      const payrollIds = payrolls.map(p => p.id);
      const response = await fetch('/api/payroll/centralize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           // We need to pass the auth token here. This is a placeholder.
           'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
        },
        body: JSON.stringify({ companyId, payrollIds, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to centralize payrolls');
      }

      onSuccess(result.voucherId, status);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Centralización Contable</h2>
        
        <div className="mb-4">
          <p className="font-semibold">Se generará el siguiente asiento contable:</p>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            {totals.baseSalary > 0 && <div><strong>Debe:</strong> {ACCOUNT_NAMES.baseSalary} - ${totals.baseSalary.toLocaleString('es-CL')}</div>}
            {totals.gratification > 0 && <div><strong>Debe:</strong> {ACCOUNT_NAMES.gratification} - ${totals.gratification.toLocaleString('es-CL')}</div>}
            {leyesSocialesPorPagar > 0 && <div className="pl-4"><strong>Haber:</strong> {ACCOUNT_NAMES.leyesSociales} - ${leyesSocialesPorPagar.toLocaleString('es-CL')}</div>}
            {totals.iut > 0 && <div className="pl-4"><strong>Haber:</strong> {ACCOUNT_NAMES.tax} - ${totals.iut.toLocaleString('es-CL')}</div>}
            {totals.netSalary > 0 && <div className="pl-4"><strong>Haber:</strong> {ACCOUNT_NAMES.netSalary} - ${totals.netSalary.toLocaleString('es-CL')}</div>}
          </div>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="flex justify-end space-x-4">
          <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded text-gray-600 bg-gray-200 hover:bg-gray-300">Cancelar</button>
          <button onClick={() => handleCentralize('Borrador')} disabled={isLoading} className="px-4 py-2 rounded text-white bg-yellow-500 hover:bg-yellow-600">Guardar como Borrador</button>
          <button onClick={() => handleCentralize('Contabilizado')} disabled={isLoading} className="px-4 py-2 rounded text-white bg-green-500 hover:bg-green-600">
            {isLoading ? 'Procesando...' : 'Contabilizar Inmediatamente'}
          </button>
        </div>
      </div>
    </div>
  );
};
