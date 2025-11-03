'use client';

import { ClientProviders } from '@/components/client-providers';

export function AppBody({ children }: { children: React.ReactNode }) {
  return <ClientProviders>{children}</ClientProviders>;
}
