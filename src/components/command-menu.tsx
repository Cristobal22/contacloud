"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  BookCopy,
  Building,
  CreditCard,
  FileText,
  Home,
  Scale,
  Settings,
  User,
  Users,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useCollection, useFirestore, useUser } from "@/firebase"
import { useUserProfile } from "@/firebase/auth/use-user-profile"
import type { Account, Company, Employee } from "@/lib/types"
import { SelectedCompanyContext } from "@/app/dashboard/layout"
import { collection, query, where, documentId, Query } from "firebase/firestore"

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const { user } = useUser()
  const { userProfile } = useUserProfile(user?.uid)
  const firestore = useFirestore();
  const { selectedCompany, setSelectedCompany } = React.useContext(SelectedCompanyContext) || {};
  const companyId = selectedCompany?.id;

  const companiesQuery = React.useMemo(() => {
    if (!firestore || !userProfile || userProfile.role !== 'Accountant' || !userProfile.companyIds || userProfile.companyIds.length === 0) {
        return null;
    }
    return query(collection(firestore, 'companies'), where(documentId(), 'in', userProfile.companyIds.slice(0, 30))) as Query<Company>;
  }, [firestore, userProfile]);

  const { data: companies } = useCollection<Company>({ query: companiesQuery, disabled: !companiesQuery });
  const { data: accounts } = useCollection<Account>({ path: companyId ? `companies/${companyId}/accounts` : undefined });
  const { data: employees } = useCollection<Employee>({ path: companyId ? `companies/${companyId}/employees` : undefined });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    
    const handleClick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.command-menu-trigger')) {
            e.preventDefault();
            setOpen((open) => !open)
        }
    }

    document.addEventListener("keydown", down)
    document.addEventListener("click", handleClick)
    
    return () => {
        document.removeEventListener("keydown", down)
        document.removeEventListener("click", handleClick)
    }
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Escribe un comando o busca..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        <CommandGroup heading="Navegación">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}><Home className="mr-2 h-4 w-4" />Dashboard</CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/vouchers'))}><FileText className="mr-2 h-4 w-4" />Comprobantes</CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/accounts'))}><BookCopy className="mr-2 h-4 w-4" />Plan de Cuentas</CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/employees'))}><Users className="mr-2 h-4 w-4" />Personal</CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/balances'))}><Scale className="mr-2 h-4 w-4" />Balances</CommandItem>
        </CommandGroup>
        
        {userProfile?.role === 'Accountant' && companies && companies.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Empresas">
              {companies.map(company => (
                <CommandItem key={company.id} onSelect={() => {
                    if(setSelectedCompany) {
                        runCommand(() => setSelectedCompany(company))
                    }
                }}>
                  <Building className="mr-2 h-4 w-4" />
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {userProfile?.role === 'Accountant' && accounts && accounts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Cuentas Contables">
               {accounts.map(account => (
                <CommandItem key={account.id} onSelect={() => runCommand(() => router.push('/dashboard/accounts'))}>
                  <BookCopy className="mr-2 h-4 w-4" />
                  {account.code} - {account.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

         {userProfile?.role === 'Accountant' && employees && employees.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Personal">
               {employees.map(employee => (
                <CommandItem key={employee.id} onSelect={() => runCommand(() => router.push(`/dashboard/employees/edit/${employee.id}`))}>
                  <User className="mr-2 h-4 w-4" />
                  {employee.firstName} {employee.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Ajustes">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
