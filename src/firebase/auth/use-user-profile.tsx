'use client';

import { useDoc } from '../firestore/use-doc';
import type { UserProfile } from '@/lib/types';
import { useFirestore } from '../provider';
import { doc } from 'firebase/firestore';

export function useUserProfile(uid: string | undefined) {
  const firestore = useFirestore();

  const userProfileRef =
    uid && firestore ? doc(firestore, 'users', uid) : null;
    
  const { data: userProfile, loading } = useDoc<UserProfile>(userProfileRef);

  return { userProfile, loading };
}
