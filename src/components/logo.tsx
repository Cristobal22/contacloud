import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'icon' | 'horizontal';
  monochrome?: boolean;
}

export function Logo({ className, variant = 'icon', monochrome = false }: LogoProps) {
  if (variant === 'horizontal') {
    const src = monochrome ? '/images/logo-horizontal-white.svg' : '/images/logo-horizontal.svg';
    return (
        <div className={cn("relative h-10 w-48", className)}>
            <Image
                src={src}
                alt="BaseImponible.cl Logo"
                width={192} // 192px width base
                height={40} // 40px height base
                className="h-full w-full object-contain"
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
        width={32} 
        height={32}
        className="h-8 w-8"
        priority
      />
      <span className="font-headline text-xl font-semibold text-primary">BaseImponible.cl</span>
    </div>
  );
}
