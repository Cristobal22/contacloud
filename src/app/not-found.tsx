'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md rounded-xl shadow-2xl">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-2xl">404 - Página No Encontrada</CardTitle>
            <CardDescription>Lo sentimos, la página que buscas no existe o ha sido movida.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
            <p className="mb-6 text-center text-sm text-muted-foreground">
                Parece que te has perdido. Volvamos al camino correcto.
            </p>
            <Button asChild>
                <Link href="/">Volver al Inicio</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
