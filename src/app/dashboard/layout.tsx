import Link from "next/link"
import {
  ChevronDown,
  Home,
  Briefcase,
  Users,
  Settings
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Logo } from "@/components/logo"
import { mockCompanies } from "@/lib/data"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
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
                    <DropdownMenuLabel>Select a Company</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {mockCompanies.map((company) => (
                        <DropdownMenuItem key={company.id}>{company.name}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden sm:flex">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4" />
                                <span>{mockCompanies[0].name}</span>
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Select a Company</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {mockCompanies.map((company) => (
                                <DropdownMenuItem key={company.id}>{company.name}</DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
