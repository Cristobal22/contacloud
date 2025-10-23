import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'icon' | 'horizontal';
  monochrome?: boolean;
}

export function Logo({ className, variant = 'icon', monochrome = false }: LogoProps) {
  if (variant === 'horizontal') {
    const src = monochrome ? '/images/logo-horizontal-white.png' : '/images/logo-horizontal.png';
    return (
        <div className={cn("relative h-10 w-48", className)}>
            <Image
                src={src}
                alt="BaseImponible.cl Logo"
                fill
                className="object-contain"
                priority
            />
        </div>
    );
  }

  // variant 'icon'
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
