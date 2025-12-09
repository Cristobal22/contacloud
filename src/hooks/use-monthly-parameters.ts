
import { useFirestore, useDoc } from '@/firebase';
import type { MonthlyParameters } from '@/lib/types';
import React from 'react';

interface UseMonthlyParametersProps {
  year?: number;
  month?: number;
  companyId?: string | null;
}

/**
 * A hook to fetch economic parameters for a specific month and year.
 * It prioritizes company-specific parameters and falls back to global ones.
 * @param year - The year to fetch parameters for.
 * @param month - The month to fetch parameters for.
 * @param companyId - The ID of the company to check for specific parameters.
 * @returns An object containing the parameters, loading state, and a detailed error if any.
 */
export function useMonthlyParameters({ year, month, companyId }: UseMonthlyParametersProps) {
  const firestore = useFirestore();

  const enabled = !!(year && month && firestore);
  const docId = enabled ? `${year}-${String(month).padStart(2, '0')}` : undefined;

  // Paths for global and company-specific indicators
  const globalDocPath = docId ? `economic-indicators/${docId}` : undefined;
  const companyDocPath = companyId && docId ? `companies/${companyId}/economic-indicators/${docId}` : undefined;

  // Fetch global parameters
  const { data: globalData, loading: globalLoading, error: globalError } = useDoc<MonthlyParameters>(firestore, globalDocPath, {
    disabled: !enabled,
  });

  // Fetch company-specific parameters
  const { data: companyData, loading: companyLoading, error: companyError } = useDoc<MonthlyParameters>(firestore, companyDocPath, {
    disabled: !enabled || !companyId,
  });

  const loading = globalLoading || companyLoading;

  // Use React.useMemo to derive the final state from the two data sources
  const { parameters, error } = React.useMemo(() => {
    if (loading) {
      return { parameters: null, error: null };
    }
    
    // Combine potential Firestore errors
    if (globalError || companyError) {
        const errorMessage = (globalError?.message || '') + (companyError?.message || '');
        return { parameters: null, error: new Error(`Error al cargar parámetros: ${errorMessage}`) };
    }

    const data = companyData || globalData; // Prioritize company-specific data

    if (enabled && !data) {
      return {
        parameters: null,
        error: new Error(`No se encontraron parámetros para ${month}/${year}. Por favor, vaya a Configuración > Parámetros Mensuales para añadirlos.`),
      };
    }

    if (data) {
      const missingParams: string[] = [];
      if (typeof data.ufValue !== 'number') missingParams.push('Valor UF');
      if (typeof data.afpTopableIncomeUF !== 'number') missingParams.push('Tope Imponible AFP (UF)');
      if (typeof data.unemploymentTopableIncomeUF !== 'number') missingParams.push('Tope Seguro Cesantía (UF)');

      if (missingParams.length > 0) {
        const source = companyData ? 'específicos de la empresa' : 'globales';
        return {
          parameters: null,
          error: new Error(`Parámetros ${source} para ${month}/${year} incompletos. Faltan: ${missingParams.join(', ')}.`),
        };
      }
    }
    
    return { parameters: data || null, error: null };
  }, [loading, globalData, companyData, enabled, month, year, globalError, companyError]);

  return { parameters, loading, error };
}
