'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { ArrowRight, Loader2 } from 'lucide-react';
import { perusahaan } from '@/lib/perusahaan';
import { columns } from './columns';
import { Payroll } from '@/lib/types';
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

const CentralizeRemunerationsPage = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCentralizing, setIsCentralizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null);

  const fetchPayrolls = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payrolls');
      if (!response.ok) {
        throw new Error('Error al obtener las liquidaciones');
      }
      const data = await response.json();
      setPayrolls(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleCentralize = async () => {
    setIsCentralizing(true);
    setError(null);
    try {
      const response = await fetch('/api/centralize-remunerations', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Error al centralizar las remuneraciones');
      }
      // Refresh the list after centralizing
      fetchPayrolls(); 
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsCentralizing(false);
    }
  };

  const handleDeletePayroll = async () => {
    if (!payrollToDelete) return;

    const originalPayrolls = [...payrolls];
    // Optimistic update
    setPayrolls(payrolls.filter(p => p.id !== payrollToDelete));

    try {
      const response = await fetch(`/api/payrolls/${payrollToDelete}`,
        {
          method: 'DELETE',
        });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar la liquidación');
      }
    } catch (error: any) {
       // Revert on error
      setPayrolls(originalPayrolls);
      setError(error.message);
    } finally {
      setPayrollToDelete(null);
    }
  };
  
  const tableMeta = {
    deletePayroll: (payrollId: string) => {
      setPayrollToDelete(payrollId);
    },
  };

  return (
    <>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Centralizar Remuneraciones</h1>
        <Card>
          <CardHeader>
            <CardTitle>Liquidaciones Preparadas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Cargando liquidaciones...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <DataTable columns={columns} data={payrolls} meta={tableMeta} />
            )}
            <div className="mt-4">
              <Button onClick={handleCentralize} disabled={isCentralizing || payrolls.length === 0}>
                {isCentralizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Centralizando...
                  </>
                ) : (
                  'Centralizar Remuneraciones'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!payrollToDelete} onOpenChange={() => setPayrollToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la liquidación de sueldo. Esta acción solo es posible si la liquidación no ha sido centralizada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayroll}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CentralizeRemunerationsPage;
