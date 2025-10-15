'use client'

import React from "react"
import Link from "next/link"
import {
  ChevronDown,
  Home,
  Briefcase,
} from "lucide-react"
import { collection } from "firebase/firestore"

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

export const SelectedCompanyContext = React.createContext<SelectedCompanyContextType | null>(null);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  
  // Solo crear la query si el usuario está autenticado
  const companiesCollection = !userLoading && user && firestore ? collection(firestore, 'companies') : null;
  
  const { data: companies, loading: companiesLoading } = useCollection<Company>({ query: companiesCollection });
  const [selectedCompany, setSelectedCompany] = React.useState<Company | null>(null);

  React.useEffect(() => {
    // Si tenemos empresas y ninguna ha sido seleccionada, seleccionamos la primera.
    if (companies && companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]); // Mantenemos selectedCompany aquí para re-evaluar si se des-selecciona por alguna razón

  const handleCompanyChange = (company: Company) => {
    setSelectedCompany(company);
  };

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Clona el elemento y le pasa el companyId
      return React.cloneElement(child, { companyId: selectedCompany?.id } as any);
    }
    return child;
  });

  // Muestra el estado de carga si el usuario o las empresas están cargando
  if (userLoading || companiesLoading) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center">
            <p>Loading...</p>
        </div>
    )
  }
  
  // Si no hay usuario (y ya no está cargando), useUser() se encargará de redirigir
  if (!user) {
      return null;
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
            <DashboardNav />
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
  )
}
