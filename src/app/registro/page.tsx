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
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "Las contraseñas no coinciden.",
      });
      setLoading(false);
      return;
    }

    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Error del servicio",
            description: "El servicio de autenticación no está disponible en este momento.",
        });
        setLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRole = 'Accountant';
      
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        role: userRole,
        displayName: user.displayName,
        photoURL: user.photoURL
      };

      const userDocRef = doc(firestore, "users", user.uid);
      setDoc(userDocRef, userProfile)
        .then(() => {
            toast({
                title: "¡Cuenta Creada!",
                description: "Tu cuenta ha sido creada exitosamente. Redirigiendo...",
            });
            router.push('/dashboard');
        })
        .catch(err => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: userProfile,
            }));
            toast({
                variant: "destructive",
                title: "Error al guardar el perfil",
                description: "No se pudo guardar la información de tu perfil. Por favor, contacta a soporte.",
            });
            setLoading(false);
        });

    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
            variant: "destructive",
            title: "Error de registro",
            description: "Este correo electrónico ya está en uso por otra cuenta.",
        });
      } else if (error.code === 'auth/weak-password') {
        toast({
            variant: "destructive",
            title: "Error de registro",
            description: "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Error inesperado",
            description: "Ocurrió un error al crear la cuenta. Por favor, inténtalo de nuevo.",
        });
      }
      console.error("Error creating user account", error);
      setLoading(false);
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
                <Input id="email" type="email" placeholder="m@ejemplo.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
              </div>
               <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input id="confirm-password" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
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
