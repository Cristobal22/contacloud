'use client';

import React, { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
}

/**
 * Un componente que renderiza a sus hijos solo en el lado del cliente.
 * Esto es útil para evitar errores de hidratación de React para componentes
 * que dependen de APIs del navegador como `window` o `localStorage`.
 */
export default function ClientOnly({ children }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
