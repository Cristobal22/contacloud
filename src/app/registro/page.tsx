
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export default function SignupPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
       <div className="w-full max-w-md">
        <Card className="rounded-xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-2xl">Registro Deshabilitado</CardTitle>
            <CardDescription>El registro de nuevas cuentas es solo por invitación del administrador.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">Redirigiendo a la página de inicio de sesión...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    