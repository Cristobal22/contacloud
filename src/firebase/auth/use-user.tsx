'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';
import { useRouter, usePathname } from 'next/navigation';

interface UseUserOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useUser({ redirectTo, redirectIfFound }: UseUserOptions = {}) {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      if(redirectTo && !pathname?.includes(redirectTo)) {
        router.push(redirectTo);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (redirectIfFound && user) {
        router.push(redirectIfFound);
      }
      if (redirectTo && !user && !pathname?.includes(redirectTo)) {
        router.push(redirectTo);
      }
    });

    return () => unsubscribe();
  }, [auth, router, redirectTo, redirectIfFound, pathname]);

  return { user, loading };
}
