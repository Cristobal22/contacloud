
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');


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
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (e: any) {
        if (e instanceof FirebaseError) {
            switch (e.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setError('El correo electrónico o la contraseña no son correctos. Por favor, inténtalo de nuevo.');
                    break;
                default:
                    setError('Ocurrió un error inesperado al iniciar sesión.');
                    console.error("Error signing in with email", e);
                    break;
            }
        } else {
            setError('Ocurrió un error inesperado.');
            console.error("An unexpected error occurred", e);
        }
    }
  }

  const handlePasswordReset = async () => {
    if (!auth || !resetEmail) {
        toast({
            variant: "destructive",
            title: "Correo inválido",
            description: "Por favor, ingresa un correo electrónico válido.",
        });
        return;
    }

    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: "Correo enviado",
            description: `Se ha enviado un correo de restablecimiento de contraseña a ${resetEmail}.`,
        });
        setIsResetDialogOpen(false);
    } catch (error: any) {
        let description = "Ocurrió un error inesperado.";
        if(error.code === 'auth/user-not-found') {
            description = "No se encontró ningún usuario con ese correo electrónico."
        }
        toast({
            variant: "destructive",
            title: "Error",
            description: description,
        });
        console.error("Error sending password reset email", error);
    }
  };

  return (
    <>
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
                    <button type="button" onClick={() => setIsResetDialogOpen(true)} className="ml-auto inline-block text-sm underline">
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full">
                  Iniciar Sesión
                </Button>
                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn}>
                  Iniciar Sesión con Google
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Restablecer Contraseña</DialogTitle>
                <DialogDescription>
                    Ingresa tu correo electrónico y te enviaremos un enlace para que puedas restablecer tu contraseña.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reset-email" className="text-right">Email</Label>
                    <Input 
                        id="reset-email" 
                        type="email"
                        value={resetEmail} 
                        onChange={(e) => setResetEmail(e.target.value)} 
                        className="col-span-3"
                        placeholder="tu@email.com"
                    />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" onClick={handlePasswordReset}>Enviar Correo</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
