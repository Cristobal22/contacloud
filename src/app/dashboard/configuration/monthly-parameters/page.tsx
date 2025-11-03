'use client';

import React from "react";
import { useCollection, useFirestore, useUser, useDoc } from "@/firebase";
import type { EconomicIndicator } from "@/lib/types";
import { doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { SelectedCompanyContext } from "../../layout";
import { useUserProfile } from "@/firebase/auth/use-user-profile";
import { HistoricalIndicatorsCard } from "./components/HistoricalIndicatorsCard";
import { CompanySpecificCard } from "./components/CompanySpecificCard";

export default function MonthlyParametersPage() {
  const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
  const companyId = selectedCompany?.id;
  const firestore = useFirestore();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = React.useState(currentYear);
  const [month, setMonth] = React.useState(currentMonth);
  const [indicator, setIndicator] = React.useState<Partial<EconomicIndicator> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCompanySpecific, setIsCompanySpecific] = React.useState(false);

  const indicatorId = `${year}-${String(month).padStart(2, '0')}`;

  const { data: allGlobalIndicators, loading: allGlobalsLoading } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });

  const companyIndicatorRef = React.useMemo(() =>
    firestore && companyId ? doc(firestore, `companies/${companyId}/economic-indicators/${indicatorId}`) : null,
  [firestore, companyId, indicatorId]);
  const { data: companyIndicator, loading: companyLoading } = useDoc<EconomicIndicator>(companyIndicatorRef as any);

  React.useEffect(() => {
    const loading = allGlobalsLoading || (companyId ? companyLoading : false);
    setIsLoading(loading);
    if (loading) return;
    
    const globalIndicatorForPeriod = allGlobalIndicators?.find(i => i.id === indicatorId);

    if (companyIndicator) {
      setIndicator(companyIndicator);
      setIsCompanySpecific(true);
    } else if (globalIndicatorForPeriod) {
      setIndicator(globalIndicatorForPeriod);
      setIsCompanySpecific(false);
    } else {
      setIndicator({ year, month });
      setIsCompanySpecific(false);
    }
  }, [year, month, allGlobalIndicators, companyIndicator, indicatorId, allGlobalsLoading, companyLoading, companyId]);

  const handleFieldChange = (field: keyof EconomicIndicator, value: string) => {
    setIndicator(prev => ({ ...(prev || { id: indicatorId, year, month }), [field]: value }));
  };

  const handleSaveCompanySpecific = async () => {
    if (!firestore || !user || !companyId) return;
    
    setIsLoading(true);
    const path = `companies/${companyId}/economic-indicators`;
    const docRef = doc(firestore, path, indicatorId);
    
    const dataToSave: Partial<EconomicIndicator> = {
      id: indicatorId,
      year: Number(year),
      month: Number(month),
      uf: Number(indicator?.uf) || undefined,
      utm: Number(indicator?.utm) || undefined,
      minWage: Number(indicator?.minWage) || undefined,
    };
    dataToSave.uta = dataToSave.utm ? Number(dataToSave.utm) * 12 : undefined;
    dataToSave.gratificationCap = dataToSave.minWage ? Math.round((4.75 * dataToSave.minWage) / 12) : undefined;

    try {
      await setDoc(docRef, dataToSave, { merge: true });
      toast({ title: 'Parámetros Guardados', description: `Los valores personalizados para ${selectedCompany?.name} han sido guardados.` });
    } catch (error) {
      console.error("Error saving indicators:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: dataToSave,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <HistoricalIndicatorsCard
        userProfile={userProfile}
        allGlobalIndicators={allGlobalIndicators}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
      />
      <CompanySpecificCard
        selectedCompany={selectedCompany}
        indicator={indicator}
        isLoading={isLoading}
        isCompanySpecific={isCompanySpecific}
        year={year}
        month={month}
        handleFieldChange={handleFieldChange}
        handleSaveCompanySpecific={handleSaveCompanySpecific}
      />
    </div>
  );
}
