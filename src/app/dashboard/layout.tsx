'use client';

import * as React from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Company, UserProfile } from '@/lib/types';
import { UserNav } from '@/components/user-nav';
import { CompanySwitcher } from '@/components/company-switcher';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname } from 'next/navigation';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { Logo } from '@/components/logo';
import { ScrollArea } from '@/components/ui/scroll-area';

// --- Reusable Status Display Component ---
function StatusDisplay({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

// --- Main Component State and Context ---
const months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear + 5 - i);

export const SelectedCompanyContext = React.createContext<any | undefined>(undefined);

// --- Layout for Regular Users (with Company Logic) ---
function UserDashboardLayout({ children, user }: { children: React.ReactNode, user: any }) {
    const firestore = useFirestore();
    const pathname = usePathname();
    const { data: userProfile } = useDoc<UserProfile>(firestore, user ? `users/${user.uid}` : undefined);

    const userCompaniesQuery = React.useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(collection(firestore, 'companies'), where('memberUids', 'array-contains', user.uid));
    }, [firestore, user?.uid]);

    const { data: companies, loading: companiesLoading } = useCollection<Company>({ 
        query: userCompaniesQuery, 
        disabled: !userCompaniesQuery 
    });

    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);
    const [periodYear, setPeriodYear] = React.useState(new Date().getFullYear());
    const [periodMonth, setPeriodMonth] = React.useState(new Date().getMonth() + 1);

    React.useEffect(() => {
        if (!companiesLoading && companies && companies.length > 0 && !selectedCompany) {
            const storedCompanyId = localStorage.getItem('selectedCompanyId');
            const companyToSelect = storedCompanyId ? companies.find(c => c.id === storedCompanyId) : companies[0];
            setSelectedCompany(companyToSelect || companies[0]);
        }
    }, [companies, companiesLoading, selectedCompany]);

    const handleCompanySwitch = (company: Company) => {
        setSelectedCompany(company);
        if (company) {
            localStorage.setItem('selectedCompanyId', company.id);
        }
    };
    
    const contextValue = { selectedCompany, setSelectedCompany: handleCompanySwitch, companies: companies || [], companiesLoading, periodYear, setPeriodYear, periodMonth, setPeriodMonth };

    // --- LOADING STATES --- 
    // First, wait for the company list to load.
    if (companiesLoading) {
        return <StatusDisplay title="Cargando Empresas" description="Buscando tus empresas asignadas..." />;
    }

    // If there are companies, but one isn't selected yet, show a brief loading state.
    // If there are no companies, this is skipped, and the dashboard renders immediately.
    if (companies && companies.length > 0 && !selectedCompany) {
        return <StatusDisplay title="Seleccionando Empresa" description="Finalizando carga..." />;
    }

    // --- RENDER THE LAYOUT ---
    const hidePeriodSelectors = pathname.startsWith('/dashboard/settings');
    const userRole = userProfile?.role === 'Admin' ? 'Admin' : 'Accountant';

    return (
        <SelectedCompanyContext.Provider value={contextValue}>
            <SidebarProvider>
                <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <Sidebar>
                        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
                           <Logo variant='horizontal' className="w-full h-auto"/>
                        </div>
                        <ScrollArea className="h-[calc(100vh-60px)]">
                            <DashboardNav role={userRole} />
                        </ScrollArea>
                    </Sidebar>
                    <div className="flex flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                            <SidebarTrigger /> 
                            <CompanySwitcher isCollapsed={false} companies={companies || []} selectedCompany={selectedCompany} onCompanySwitch={handleCompanySwitch} />
                            <div className="ml-auto flex items-center space-x-4">
                                {!hidePeriodSelectors && selectedCompany && (
                                    <div className="flex items-center gap-2">
                                        <Select value={String(periodMonth)} onValueChange={(val) => setPeriodMonth(Number(val))}><SelectTrigger className="w-[140px]"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent></Select>
                                        <Select value={String(periodYear)} onValueChange={(val) => setPeriodYear(Number(val))}><SelectTrigger className="w-[100px]"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                )}
                                <UserNav />
                            </div>
                        </header>
                        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </SelectedCompanyContext.Provider>
    );
}

// --- Layout for Admins (No Company Logic) ---
function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const contextValue = { selectedCompany: null, setSelectedCompany: () => {}, companies: [], companiesLoading: false, periodYear: null, setPeriodYear: () => {}, periodMonth: null, setPeriodMonth: () => {} };

    return (
        <SelectedCompanyContext.Provider value={contextValue}>
            <SidebarProvider>
                <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
                    <Sidebar>
                        <div className="flex h-14 items-center border-b px-6 lg:h-[60px]">
                           <Logo variant='horizontal' className="w-full h-auto"/>
                        </div>
                        <ScrollArea className="h-[calc(100vh-60px)]">
                            <DashboardNav role="Admin" />
                        </ScrollArea>
                    </Sidebar>
                    <div className="flex flex-col">
                        <header className="flex h-14 items-center justify-end gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                            <SidebarTrigger /> 
                            <div className="ml-auto flex items-center space-x-4">
                                <UserNav />
                            </div>
                        </header>
                        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </SelectedCompanyContext.Provider>
    );
}

// --- Main Layout Component (Role-Based Router) ---
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useUser();
    const firestore = useFirestore();
    const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(firestore, user ? `users/${user.uid}` : undefined);

    if (authLoading || profileLoading) {
        return <StatusDisplay title="Cargando Sesión" description="Verificando tus credenciales..." />;
    }

    if (userProfile?.role === 'Admin') {
        return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
    }

    return <UserDashboardLayout user={user}>{children}</UserDashboardLayout>;
}