'use client'

import React from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  React.useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Firebase Permission Error Caught by Listener:", error);
      
      toast({
        variant: "destructive",
        title: "Error de Permisos",
        description: `No tienes permiso para realizar la acción: ${error.context.operation} en ${error.context.path}.`,
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
