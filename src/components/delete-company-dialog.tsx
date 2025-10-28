
'use client';

import React from 'react';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Company } from '@/lib/types';
import { useFunctions } from '@/firebase';

interface DeleteCompanyDialogProps {
  company: Company;
}

export function DeleteCompanyDialog({ company }: DeleteCompanyDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { toast } = useToast();
  const functions = useFunctions();
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmation !== company.name) {
      toast({ 
        variant: 'destructive', 
        title: 'Error',
        description: 'El nombre de la empresa no coincide.',
      });
      return;
    }

    setIsDeleting(true);

    try {
      const deleteCompany = httpsCallable(functions, 'deleteCompany');
      await deleteCompany({ companyId: company.id });
      
      toast({ 
        title: 'Empresa eliminada',
        description: `La empresa ${company.name} y todos sus datos han sido eliminados.`,
      });
      
      setIsOpen(false);
      router.push('/dashboard'); // Redirect to a safe page

    } catch (error: any) {
      console.error("Error deleting company:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Error al eliminar',
        description: error.message || 'Ocurrió un error inesperado. Por favor, revisa los logs de la función.',
      });
    } finally {
      setIsDeleting(false);
      setConfirmation('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Eliminar Empresa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
          <DialogDescription>
            Esta acción es irreversible. Se eliminarán permanentemente la empresa 
            <span className="font-bold text-foreground">{company.name}</span> 
            y todos sus datos asociados, incluyendo cuentas, compras, ventas, empleados y comprobantes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Label htmlFor="company-name-confirmation">Por favor, escribe <span className="font-bold text-foreground">{company.name}</span> para confirmar.</Label>
          <Input 
            id="company-name-confirmation" 
            value={confirmation} 
            onChange={(e) => setConfirmation(e.target.value)} 
            placeholder="Nombre de la empresa"
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>Cancelar</Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting || confirmation !== company.name}
          >
            {isDeleting ? 'Eliminando...' : 'Entiendo las consecuencias, eliminar esta empresa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
