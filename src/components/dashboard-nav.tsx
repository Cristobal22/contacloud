'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  LayoutDashboard,
  BookUser,
  ArrowRightLeft,
  Users,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from './ui/tooltip';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/companies', label: 'Companies', icon: Briefcase },
    { href: '/dashboard/accounts', label: 'Chart of Accounts', icon: BookUser },
    { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/dashboard/payroll', label: 'Payroll', icon: Users },
    { href: '/dashboard/tax-documents', label: 'Tax Documents', icon: FileText },
];

const bottomNavItems = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  const renderNavItems = (items: typeof navItems) => {
    return items.map((item) => {
      const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
      const linkClasses = cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
        isActive && 'bg-muted text-primary'
      );
      const collapsedLinkClasses = cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
        isActive && 'bg-accent text-accent-foreground'
      );

      if (isCollapsed) {
        return (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={item.href} className={collapsedLinkClasses}>
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      }

      return (
        <Link key={item.href} href={item.href} className={linkClasses}>
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      );
    });
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col justify-between">
        <nav className={`grid items-start gap-1 ${isCollapsed ? 'px-2' : 'px-4'} text-sm font-medium`}>
          {renderNavItems(navItems)}
        </nav>
        <nav className={`mt-auto grid items-start gap-1 ${isCollapsed ? 'px-2' : 'px-4'} text-sm font-medium`}>
          {renderNavItems(bottomNavItems)}
        </nav>
      </div>
    </TooltipProvider>
  );
}
