'use client'

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  Home,
  Briefcase,
  Calendar as CalendarIcon,
} from "lucide-react"
import { collection, query, where, documentId, doc, updateDoc } from "firebase/firestore"
import { format, startOfMonth, endOfMonth, parseISO, isAfter, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Logo } from "@/components/logo"
import type { Company, SelectedCompanyContextType } from "@/lib/types"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { useUserProfile } from "@/firebase/auth/use-user-profile"
import { useToast } from "@/hooks/use-toast"
import { CommandMenu } from "@/components/command-menu"

export const SelectedCompanyContext = React.createContext<SelectedCompanyContextType | null>(null);

function AccountantDashboardLayout({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
    const { toast } = useToast();
    const router = useRouter();
    
    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [isLoadingCompany, setIsLoadingCompany] = React.useState(true);

    // Esta consulta es segura para contadores. Solo pide las empresas de su lista.
    const companiesQuery = React.useMemo(() => {
        if (!firestore || !userProfile || userProfile.role !== 'Accountant' || !userProfile.companyIds || userProfile.companyIds.length === 0) {
            return null;
        }
        // Firestore 'in' queries are limited to 30 elements. We slice to stay within limits.
        return query(collection(firestore, 'companies'), where(documentId(), 'in', userProfile.companyIds.slice(0, 30)));
    }, [firestore, userProfile]);

    const { data: companies, loading: companiesLoading } = useCollection<Company>({ 
      query: companiesQuery,
      // Deshabilitar la consulta si el perfil se está cargando, no hay consulta válida, o si el usuario no es contador.
      disabled: profileLoading || !companiesQuery || userProfile?.role !== 'Accountant'
    });
    
    React.useEffect(() => {
        const loading = companiesLoading || profileLoading || userLoading;
        if (loading) return;

        if (companies && companies.length > 0) {
            const storedCompanyId = localStorage.getItem('selectedCompanyId');
            const company = companies.find(c => c.id === storedCompanyId) || companies[0];
            if (company) {
                setSelectedCompany(company);
            }
        } else {
            setSelectedCompany(null);
        }
        setIsLoadingCompany(false);

    }, [companies, companiesLoading, profileLoading, userLoading]);

    // Check for expired subscription
    React.useEffect(() => {
      if (userProfile?.role === 'Accountant' && userProfile.subscriptionEndDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
          const endDate = parseISO(userProfile.subscriptionEndDate);
          const daysRemaining = differenceInDays(endDate, today);

          if (isAfter(today, endDate)) {
              toast({
                  variant: "destructive",
                  title: "Suscripción Expirada",
                  description: "Tu acceso ha expirado. Por favor, renueva tu plan para continuar.",
                  duration: 8000,
              });
              router.push('/dashboard/billing');
          } else if (daysRemaining <= 5) {
              toast({
                  title: "Aviso de Suscripción",
                  description: `Tu plan expira en ${daysRemaining + 1} día(s). Asegúrate de renovarlo para no perder el acceso.`,
                  duration: 8000,
              });
          }
      }
    }, [userProfile, router, toast]);

    const handleCompanyChange = (company: Company) => {
        setSelectedCompany(company);
        localStorage.setItem('selectedCompanyId', company.id);
    };
    
    const handlePeriodChange = async (year: number, month: number) => {
        if (!firestore || !selectedCompany) return;

        const newPeriodStart = startOfMonth(new Date(year, month));
        const newPeriodEnd = endOfMonth(new Date(year, month));

        const companyRef = doc(firestore, 'companies', selectedCompany.id);
        try {
            await updateDoc(companyRef, {
                periodStartDate: format(newPeriodStart, 'yyyy-MM-dd'),
                periodEndDate: format(newPeriodEnd, 'yyyy-MM-dd'),
            });

            const updatedCompany = { 
                ...selectedCompany, 
                periodStartDate: format(newPeriodStart, 'yyyy-MM-dd'),
                periodEndDate: format(newPeriodEnd, 'yyyy-MM-dd'),
            };
            setSelectedCompany(updatedCompany);

            toast({
                title: 'Período Actualizado',
                description: `El período de trabajo se ha cambiado a ${format(newPeriodStart, 'MMMM yyyy', { locale: es })}.`
            });
        } catch (error) {
            console.error("Error updating period:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo actualizar el período de trabajo.'
            });
        }
    };
    
    const isLoading = userLoading || profileLoading || companiesLoading || isLoadingCompany;
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(0, i), 'MMMM', { locale: es }) }));

    const periodLabel = selectedCompany?.periodStartDate 
        ? format(parseISO(selectedCompany.periodStartDate), 'MMMM yyyy', { locale: es })
        : 'Sin Período';

    return (
        <SelectedCompanyContext.Provider value={{ selectedCompany, setSelectedCompany: handleCompanyChange }}>
            <CommandMenu />
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                    <div className="flex h-16 items-center border-b px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <Logo />
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-4">
                        <DashboardNav role="Accountant" />
                    </div>
                </aside>

                <div className="flex flex-col sm:pl-64">
                    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:justify-end sm:px-6">
                        <div className="flex items-center gap-4">
                            {/* Mobile menu - placeholder */}
                            <Button variant="outline" className="sm:hidden">
                                <Home className="h-4 w-4" />
                                <span className="sr-only">Toggle Company</span>
                            </Button>

                            <div className="hidden sm:flex items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2" disabled={isLoading}>
                                            <Briefcase className="h-4 w-4" />
                                            <span>{selectedCompany?.name || 'Seleccionar Empresa'}</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Selecciona una Empresa</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {companies && companies.length > 0 ? companies.map((company) => (
                                            <DropdownMenuItem key={company.id} onSelect={() => handleCompanyChange(company)}>{company.name}</DropdownMenuItem>
                                        )) : (
                                            <DropdownMenuItem disabled>No tienes empresas asignadas.</DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2 capitalize" disabled={isLoading || !selectedCompany}>
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>{periodLabel}</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Cambiar Período de Trabajo</DropdownMenuLabel>
                                        <DropdownMenuSeparator/>
                                         <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                <span>{selectedCompany?.periodStartDate ? parseISO(selectedCompany.periodStartDate).getFullYear() : 'Año'}</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {years.map(year => (
                                                        <DropdownMenuItem key={year} onSelect={() => handlePeriodChange(year, selectedCompany?.periodStartDate ? parseISO(selectedCompany.periodStartDate).getMonth() : new Date().getMonth())}>
                                                            {year}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                        <DropdownMenuSub>
                                            <DropdownMenuSubTrigger>
                                                 <span>{selectedCompany?.periodStartDate ? format(parseISO(selectedCompany.periodStartDate), 'MMMM', { locale: es}) : 'Mes'}</span>
                                            </DropdownMenuSubTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuSubContent>
                                                    {months.map(month => (
                                                        <DropdownMenuItem key={month.value} onSelect={() => handlePeriodChange(selectedCompany?.periodStartDate ? parseISO(selectedCompany.periodStartDate).getFullYear() : new Date().getFullYear(), month.value)}>
                                                            {month.label}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuSubContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenuSub>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <UserNav />
                    </header>
                    <main className="flex-1 p-4 sm:p-6">
                        {isLoading ? <div className="flex h-full w-full items-center justify-center"><p>Cargando datos del contador...</p></div> : children}
                    </main>
                </div>
            </div>
        </SelectedCompanyContext.Provider>
    );
}

function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                        <Logo />
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <DashboardNav role="Admin" />
                </div>
            </aside>

            <div className="flex flex-col sm:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6">
                    <CommandMenu />
                    <UserNav />
                </header>
                <main className="flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading: userLoading } = useUser();
    const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);
    
    if (userLoading || profileLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <p>Cargando perfil...</p>
            </div>
        );
    }
    
    if (userProfile?.role === 'Admin') {
        return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
    }

    if (userProfile?.role === 'Accountant') {
        return <AccountantDashboardLayout>{children}</AccountantDashboardLayout>;
    }
    
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>No tienes un rol asignado. Contacta al administrador.</p>
        </div>
    );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: userLoading } = useUser({ redirectTo: '/login' });
  
  if (userLoading || !user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Cargando...</p>
        </div>
    )
  }
  
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}

    