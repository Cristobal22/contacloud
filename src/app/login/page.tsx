
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);


  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with Google", error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
     try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error signing in with email", error);
      setError('Invalid email or password.');
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-2xl">Bienvenido de Nuevo</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleEmailSignIn}>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="m@ejemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="#" className="ml-auto inline-block text-sm underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full">
                Iniciar Sesión
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                Iniciar Sesión con Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    