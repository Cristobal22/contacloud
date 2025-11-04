'use client';

import { useDoc } from '../firestore/use-doc';
import type { UserProfile } from '@/lib/types';
import { useFirestore } from '../provider';
import { doc } from 'firebase/firestore';
import React from 'react';

export function useUserProfile(uid: string | undefined) {
  const firestore = useFirestore();

  const userProfileRef = React.useMemo(() => {
    if (!uid || !firestore) return null;
    return doc(firestore, 'users', uid);
  }, [uid, firestore]);
    
  const { data: userProfile, loading, refetch } = useDoc<UserProfile>(userProfileRef);

  return { userProfile, loading, refetchUserProfile: refetch };
}
