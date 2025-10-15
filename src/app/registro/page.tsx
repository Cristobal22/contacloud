'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import React, { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (!auth || !firestore) {
        setError('Servicio de autenticación no disponible.');
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if this is the first user
      const usersCollection = collection(firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      const isFirstUser = userSnapshot.empty;
      
      const userRole = isFirstUser ? 'Admin' : 'Accountant';
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: userRole,
        displayName: user.displayName,
        photoURL: user.photoURL
      };

      // Create user profile document in Firestore
      await setDoc(doc(firestore, "users", user.uid), userProfile);

      router.push('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está en uso.');
      } else if (error.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al crear la cuenta. Inténtalo de nuevo.');
      }
      console.error("Error creating user account", error);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
              <Logo />
            </div>
            <CardTitle className="font-headline text-2xl">Crear una Cuenta</CardTitle>
            <CardDescription>Ingresa tus datos para crear una nueva cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSignUp}>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="m@ejemplo.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
               {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                Crear Cuenta
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="underline">
                Iniciar Sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    