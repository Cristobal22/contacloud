'use client'

import React from "react"
import Link from "next/link"
import {
  ChevronDown,
  Home,
  Briefcase,
} from "lucide-react"
import { collection, query } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Logo } from "@/components/logo"
import type { Company, SelectedCompanyContextType } from "@/lib/types"
import { useUser, useFirestore, useCollection } from "@/firebase"
import { useUserProfile } from "@/firebase/auth/use-user-profile"
import { useRouter, usePathname } from 'next/navigation'

export const SelectedCompanyContext = React.createContext<SelectedCompanyContextType | null>(null);

function AccountantDashboard({ children }: { children: React.ReactNode }) {
    const firestore = useFirestore();
    const { user, loading: userLoading } = useUser();
    
    const { data: companies, loading: companiesLoading } = useCollection<Company>({ 
      query: firestore ? collection(firestore, 'companies') : null,
      disabled: userLoading || !user,
    });

    const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);

    React.useEffect(() => {
        if (companies && companies.length > 0 && !selectedCompany) {
            setSelectedCompany(companies[0]);
        }
    }, [companies, selectedCompany]);

    const handleCompanyChange = (company: Company) => {
        setSelectedCompany(company);
    };

    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // @ts-ignore
            return React.cloneElement(child, { companyId: selectedCompany?.id });
        }
        return child;
    });

    if (companiesLoading) {
        return <div className="flex h-full w-full items-center justify-center"><p>Cargando empresas...</p></div>
    }

    return (
        <SelectedCompanyContext.Provider value={{ selectedCompany, setSelectedCompany }}>
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
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="sm:hidden">
                                    <Home className="h-4 w-4" />
                                    <span className="sr-only">Toggle Company</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Selecciona una Empresa</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {companies?.map((company) => (
                                    <DropdownMenuItem key={company.id} onSelect={() => handleCompanyChange(company)}>{company.name}</DropdownMenuItem>
                                ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="hidden sm:flex">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4" />
                                            <span>{selectedCompany?.name || 'Seleccionar Empresa'}</span>
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuLabel>Selecciona una Empresa</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {companies?.map((company) => (
                                            <DropdownMenuItem key={company.id} onSelect={() => handleCompanyChange(company)}>{company.name}</DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <UserNav />
                    </header>
                    <main className="flex-1 p-4 sm:p-6">
                        {childrenWithProps}
                    </main>
                </div>
            </div>
        </SelectedCompanyContext.Provider>
    );
}

function AdminDashboard({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/dashboard/admin/users" className="flex items-center gap-2 font-semibold">
                        <Logo />
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-4">
                    <DashboardNav role="Admin" />
                </div>
            </aside>

            <div className="flex flex-col sm:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b bg-background px-4 sm:px-6">
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
    const router = useRouter();
    const pathname = usePathname();
    
    React.useEffect(() => {
        // Wait until we have all the user info.
        if (userLoading || !user || profileLoading || !userProfile) {
            return;
        }
        
        const isAdminPage = pathname.startsWith('/dashboard/admin');
        
        // If the user is an Admin but is not on an admin page, redirect them.
        if (userProfile.role === 'Admin' && !isAdminPage) {
            router.replace('/dashboard/admin/users');
        }

    }, [userLoading, user, profileLoading, userProfile, pathname, router]);

    if (userLoading || !user || profileLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center">
                <p>Cargando perfil...</p>
            </div>
        );
    }
    
    if (userProfile?.role === 'Admin') {
        return <AdminDashboard>{children}</AdminDashboard>;
    }

    if (userProfile?.role === 'Accountant') {
        return <AccountantDashboard>{children}</AccountantDashboard>;
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
