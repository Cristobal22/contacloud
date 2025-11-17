import { collectionGroup, query, where } from 'firebase/firestore';
import { useFirestoreQuery } from '@react-query-firebase/firestore';

import { db } from '@/config/firebase';

import { Employee } from '@/features/employees/types/employee';

export const useGetEmployeesForSettlement = (companyId: string) => {
  if (!companyId) {
    throw new Error('Company ID is required to get employees for settlement');
  }

  const ref = query(
    collectionGroup(db, 'employees'), // Use collectionGroup for the secure, cross-company query
    where('companyId', '==', companyId),
    where('status', '==', 'Active')
  );

  const queryKey = ['employees', companyId, 'active-for-settlement'];

  const employeesQuery = useFirestoreQuery<Employee[]>(queryKey, ref, {
    subscribe: true,
  });

  return employeesQuery;
};
