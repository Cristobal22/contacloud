'use client'

import React from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

export function FirebaseErrorListener() {

  React.useEffect(() => {
    const handleError = (error: any) => {
      // In a real app, you might use a toast notification
      // For this prototype, we'll just log it to the console
      console.error("Firebase Permission Error Caught by Listener:", error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything
}
