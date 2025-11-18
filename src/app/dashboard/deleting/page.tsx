'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { terminate } from 'firebase/firestore';
import { useFunctions, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

// This is a dedicated page to handle company deletion securely.
export default function DeletingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const functions = useFunctions();
  const firestore = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    const companyId = searchParams.get('id');
    const companyName = searchParams.get('name');

    if (!companyId || !companyName) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Falta información para eliminar la empresa.' 
      });
      router.push('/dashboard');
      return;
    }

    const deleteCompany = async () => {
      try {
        // --- THE FINAL, CORRECT SOLUTION ---
        // 1. Terminate the local Firestore instance. This is the crucial step.
        // It closes all listeners and prevents the SDK from using its inconsistent cache,
        // which is the root cause of the permission-denied errors on reload.
        if (firestore) {
          await terminate(firestore);
        }

        // 2. Call the cloud function to delete the data from the server.
        const deleteCompanyFunc = httpsCallable(functions, 'deleteCompany');
        await deleteCompanyFunc({ companyId });
        
        toast({ 
          title: 'Empresa eliminada',
          description: `La empresa ${companyName} se ha eliminado correctamente.`,
        });

        // 3. Clear the stale company ID from local storage.
        localStorage.removeItem('selectedCompanyId');

      } catch (error: any) {
        console.error("Error during company deletion process:", error);
        toast({ 
          variant: 'destructive', 
          title: 'Error al eliminar',
          description: error.message || 'Ocurrió un error inesperado al eliminar la empresa.',
        });
      } finally {
        // 4. A full, clean reload is the safest way to re-initialize the app.
        window.location.href = '/dashboard';
      }
    };

    deleteCompany();
    
  }, [searchParams, router, functions, toast, firestore]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-4">
        <p className="text-lg font-medium">Eliminando empresa...</p>
        <p className="text-sm text-muted-foreground">Por favor, espera. Esto puede tardar unos segundos.</p>
    </div>
  );
}
