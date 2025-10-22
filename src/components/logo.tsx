import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image 
        src="/images/logo.svg" 
        alt="BaseImponible.cl Logo" 
        width={24} 
        height={24}
        className="h-6 w-6"
      />
      <span className="font-headline text-xl font-semibold text-primary">BaseImponible.cl</span>
    </div>
  );
}
