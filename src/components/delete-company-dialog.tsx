'use client';

import React from 'react';
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

interface DeleteCompanyDialogProps {
  company: Company;
}

// REWRITTEN COMPONENT
// The dialog is now only responsible for confirming the user's intent and navigating
// to a dedicated, clean page to perform the deletion. This avoids all race conditions.
export function DeleteCompanyDialog({ company }: DeleteCompanyDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleNavigateToDelete = () => {
    if (confirmation !== company.name) {
      toast({ 
        variant: 'destructive', 
        title: 'Error',
        description: 'El nombre de la empresa no coincide.',
      });
      return;
    }

    // Navigate to the dedicated deleting page, passing company info as search params.
    // The page will handle the actual deletion in a clean environment.
    router.push(`/dashboard/deleting?id=${company.id}&name=${encodeURIComponent(company.name)}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setConfirmation(''); // Reset on close
    }}>
      <DialogTrigger asChild>
        <Button variant="destructive">Eliminar Empresa</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Estás absolutamente seguro?</DialogTitle>
          <DialogDescription>
            Esta acción es irreversible. Se eliminarán permanentemente la empresa 
            <span className="font-bold text-foreground">{company.name}</span> 
            y todos sus datos asociados.
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button 
            variant="destructive" 
            onClick={handleNavigateToDelete} 
            disabled={confirmation !== company.name}
          >
            Entiendo, eliminar esta empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
