'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React from 'react';


interface LogoProps {
  className?: string;
  variant?: 'icon' | 'horizontal';
}

export function Logo({ className, variant = 'icon' }: LogoProps) {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const horizontalSrc = resolvedTheme === 'dark' ? '/images/logo-horizontal-white.svg' : '/images/logo-horizontal.svg';

    if (!mounted) {
        // Render a placeholder or nothing on the server to avoid hydration mismatch
        if (variant === 'icon') {
            return <div className={cn("h-6 w-6", className)} />;
        }
        return <div className={cn("w-44 h-9", className)} />;
    }

  if (variant === 'horizontal') {
    return (
        <Image
            src={horizontalSrc}
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
