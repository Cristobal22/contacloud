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
  UserPlus,
  FileUp,
  BookMarked,
  FileArchive,
  Award,
  Library,
  Book,
  FileCog,
  RefreshCw,
  Lock,
  Building,
  HeartPulse,
  Wallet,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import React from 'react';

const accountantNavSections = [
    {
        title: 'Contabilidad',
        icon: Landmark,
        links: [
            { href: '/dashboard', label: 'Dashboard', icon: Home },
        ],
        subSections: [
            {
                title: 'Movimientos',
                icon: Banknote,
                links: [
                    { href: '/dashboard/vouchers', label: 'Comprobantes', icon: FileText },
                    { href: '/dashboard/bank-reconciliation', label: 'Conciliación Bancaria', icon: Scale },
                ]
            }
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
];

const payrollSections = [
    {
        title: 'Movimientos',
        icon: UserPlus,
        links: [
            { href: '/dashboard/employees', label: 'Ficha de Personal', icon: Contact },
            { href: '/dashboard/payroll', label: 'Liquidaciones', icon: FileText },
        ]
    },
    {
        title: 'Procesos',
        icon: FileCog,
        links: [
            { href: '/dashboard/remuneraciones/import-previred', label: 'Importar Previred', icon: FileUp },
        ]
    },
    {
        title: 'Informes',
        icon: BookMarked,
        links: [
            { href: '/dashboard/remuneraciones/libro-remuneraciones', label: 'Libro Remuneraciones', icon: BookOpen },
            { href: '/dashboard/remuneraciones/archivo-previred', label: 'Archivo Previred', icon: FileArchive },
            { href: '/dashboard/remuneraciones/certificado-remuneraciones', label: 'Certificado Remuneraciones', icon: Award },
        ]
    },
    {
        title: 'Maestros',
        icon: Briefcase,
        links: [
            { href: '/dashboard/remuneraciones/instituciones', label: 'Instituciones', icon: Library },
            { href: '/dashboard/remuneraciones/entidades-salud', label: 'Entidades de Salud', icon: HeartPulse },
            { href: '/dashboard/remuneraciones/afp', label: 'Entidades AFP', icon: Wallet },
            { href: '/dashboard/remuneraciones/parametros-asig-familiar', label: 'Parámetros Asig. Familiar', icon: Book },
            { href: '/dashboard/remuneraciones/parametros-iut', label: 'Parámetros IUT', icon: Book },
        ]
    }
];

const criticalProcessesSections = [
    {
        title: 'Centralización',
        icon: RefreshCw,
        links: [
            { href: '/dashboard/critical-processes/centralization-remunerations', label: 'Centralización Remuneraciones', icon: FileText },
            { href: '/dashboard/purchases', label: 'Centralización Compras', icon: FileText },
            { href: '/dashboard/sales', label: 'Centralización Ventas', icon: FileText },
        ]
    },
    {
        title: 'Cierres',
        icon: Lock,
        links: [
            { href: '/dashboard/critical-processes/monthly-closing', label: 'Cierre Mensual', icon: FileText },
        ]
    }
];

const configurationSections = [
    {
        title: 'General',
        icon: Settings,
        links: [
            { href: '/dashboard/companies', label: 'Empresas', icon: Building },
            { href: '/dashboard/configuration/monthly-parameters', label: 'Parámetros Mensuales', icon: Book },
        ]
    }
];

const adminNavSections = [
    {
        title: 'Administración',
        icon: UserCog,
        links: [
            { href: '/dashboard', label: 'Gestión de Usuarios', icon: Users },
        ]
    }
]

const bottomNavItems = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

type DashboardNavProps = {
    role: 'Admin' | 'Accountant';
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    'Contabilidad': true,
    'Movimientos': true,
    'Informes': true,
    'Maestros': true,
    'Remuneraciones': true,
    'Movimientos_sub': true,
    'Procesos_sub': true,
    'Informes_sub': true,
    'Maestros_sub': true,
    'Procesos Críticos': false,
    'Centralización_sub': true,
    'Cierres_sub': true,
    'Configuración': false,
    'General_sub': true,
    'Administración': true,
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

  const renderSection = (section: { title: string, icon: React.ElementType, links: { href: string, label: string, icon: React.ElementType }[], subSections?: any[] }) => (
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
            {section.subSections?.map((subSection) => (
                <Collapsible key={subSection.title} open={openSections[subSection.title]} onOpenChange={() => toggleSection(subSection.title)}>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary">
                        <div className="flex items-center gap-3">
                            <subSection.icon className="h-4 w-4" />
                            <span>{subSection.title}</span>
                        </div>
                        {openSections[subSection.title] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-7 flex flex-col gap-1 border-l border-muted-foreground/20 pl-5 py-2">
                        {subSection.links.map(renderLink)}
                    </CollapsibleContent>
                </Collapsible>
            ))}
        </CollapsibleContent>
    </Collapsible>
  );

  const renderNestedSection = (
      parentTitle: string, 
      ParentIcon: React.ElementType, 
      subSections: { title: string, icon: React.ElementType, links: { href: string, label: string, icon: React.ElementType }[] }[],
      defaultOpen = true
    ) => {
        return (
        <Collapsible open={openSections[parentTitle] ?? defaultOpen} onOpenChange={() => toggleSection(parentTitle)}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary">
                <div className="flex items-center gap-3">
                <ParentIcon className="h-4 w-4" />
                <span>{parentTitle}</span>
                </div>
                {openSections[parentTitle] ?? defaultOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-7 flex flex-col gap-1 border-l border-muted-foreground/20 pl-5 py-2">
                {subSections.map((subSection) => (
                    <Collapsible key={subSection.title} open={openSections[subSection.title + '_sub']} onOpenChange={() => toggleSection(subSection.title + '_sub')}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-muted-foreground hover:text-primary">
                            <div className="flex items-center gap-3">
                                <subSection.icon className="h-4 w-4" />
                                <span>{subSection.title}</span>
                            </div>
                            {openSections[subSection.title + '_sub'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="ml-7 flex flex-col gap-1 border-l border-muted-foreground/20 pl-5 py-2">
                            {subSection.links.map(renderLink)}
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </CollapsibleContent>
        </Collapsible>
    )};

    const navContent = role === 'Admin' ? (
        <>
            {adminNavSections.map(renderSection)}
        </>
    ) : (
        <>
            {accountantNavSections.map(renderSection)}
            {renderNestedSection('Remuneraciones', Users, payrollSections)}
            {renderNestedSection('Procesos Críticos', RefreshCw, criticalProcessesSections, false)}
            {renderNestedSection('Configuración', SlidersHorizontal, configurationSections, false)}
        </>
    );

  return (
    <div className="flex h-full flex-col justify-between">
      <nav className="grid items-start gap-2 px-4 text-sm font-medium">
        {navContent}
      </nav>
      <nav className="mt-auto grid items-start gap-1 px-4 text-sm font-medium">
        {bottomNavItems.map(renderLink)}
      </nav>
    </div>
  );
}
