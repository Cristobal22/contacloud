
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
        <Image
            src={src}
            alt="BaseImponible.cl Logo"
            width={240}
            height={60}
            className={cn("object-contain", className)}
            priority
        />
    );
  }

  // variant 'icon'
  return (
    <Image 
      src="/images/logo.svg" 
      alt="BaseImponible.cl Logo" 
      width={24}
      height={24}
      className={cn("object-contain", className)}
      priority
    />
  );
}
