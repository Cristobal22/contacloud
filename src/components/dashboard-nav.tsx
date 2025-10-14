'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote,
  BookCopy,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ChevronUp,
  CircleUser,
  Contact,
  FileText,
  Home,
  Landmark,
  LineChart,
  List,
  Scale,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import React from 'react';

const navSections = [
    {
        title: 'Contabilidad',
        icon: Landmark,
        links: [
            { href: '/dashboard', label: 'Dashboard', icon: Home },
        ]
    },
    {
        title: 'Movimientos',
        icon: Banknote,
        links: [
            { href: '/dashboard/vouchers', label: 'Comprobantes', icon: FileText },
            { href: '/dashboard/purchases', label: 'Compras', icon: FileText },
            { href: '/dashboard/sales', label: 'Ventas', icon: FileText },
            { href: '/dashboard/fees', label: 'Honorarios', icon: FileText },
            { href: '/dashboard/bank-reconciliation', label: 'Conciliación Bancaria', icon: Scale },
        ]
    },
    {
        title: 'Informes',
        icon: LineChart,
        links: [
            { href: '/dashboard/journal', label: 'Libro Diario', icon: BookOpen },
            { href: '/dashboard/ledger', label: 'Libro Mayor', icon: BookCopy },
            { href: '/dashboard/balances', label: 'Balances', icon: Scale },
            { href: '/dashboard/general-balance', label: 'Balance General', icon: Scale },
            { href: '/dashboard/vat-summary', label: 'Resumen Mensual IVA', icon: FileText },
        ]
    },
    {
        title: 'Maestros',
        icon: List,
        links: [
            { href: '/dashboard/accounts', label: 'Plan de Cuentas', icon: BookCopy },
            { href: '/dashboard/account-groups', label: 'Grupos de Cuentas', icon: List },
            { href: '/dashboard/subjects', label: 'Sujetos', icon: CircleUser },
            { href: '/dashboard/cost-centers', label: 'Centros de Costos', icon: Building2 },
        ]
    },
    {
        title: 'Remuneraciones',
        icon: Users,
        links: [
            { href: '/dashboard/employees', label: 'Personal', icon: Contact },
            { href: '/dashboard/payroll', label: 'Liquidaciones', icon: Users },
        ]
    },
];

const bottomNavItems = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    'Contabilidad': true,
    'Movimientos': true,
    'Informes': true,
    'Maestros': true,
    'Remuneraciones': true,
  });

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const renderLink = (item: { href: string, label: string, icon: React.ElementType }) => {
    const isActive = pathname === item.href;
    return (
        <Link
            key={item.href}
            href={item.href}
            className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary'
            )}
        >
            <item.icon className="h-4 w-4" />
            {item.label}
        </Link>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <nav className="grid items-start gap-2 px-4 text-sm font-medium">
        {navSections.map((section) => (
          <Collapsible key={section.title} open={openSections[section.title]} onOpenChange={() => toggleSection(section.title)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary">
              <div className="flex items-center gap-3">
                <section.icon className="h-4 w-4" />
                <span>{section.title}</span>
              </div>
              {openSections[section.title] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-7 flex flex-col gap-1 border-l border-muted-foreground/20 pl-5 py-2">
              {section.links.map(renderLink)}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>
      <nav className="mt-auto grid items-start gap-1 px-4 text-sm font-medium">
        {bottomNavItems.map(renderLink)}
      </nav>
    </div>
  );
}
