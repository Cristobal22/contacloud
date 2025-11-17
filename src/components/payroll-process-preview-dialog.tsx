'use client';

import React from 'react';
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { SelectedCompanyContext } from "@/app/dashboard/layout";
import type { PayrollDraft } from '@/lib/types';

interface PayrollProcessPreviewDialogProps {
    drafts: PayrollDraft[];
    year: string;
    month: string;
    onSuccess: () => void; // Add a callback for when the process is successful
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

export function PayrollProcessPreviewDialog({ drafts, year, month, onSuccess }: PayrollProcessPreviewDialogProps) {
    const { toast } = useToast();
    const { user } = useUser();
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const [isOpen, setIsOpen] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleProcess = async () => {
        if (!user || !selectedCompany || drafts.length === 0 || !year || !month) {
            toast({ variant: "destructive", title: "Error", description: "No se cumplen las condiciones para procesar." });
            return;
        }

        setIsProcessing(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/payroll/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    companyId: selectedCompany.id,
                    drafts: drafts,
                    year: year,
                    month: month,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Ocurrió un error en el servidor");
            }

            toast({ title: "Éxito", description: `${result.processedCount} liquidaciones procesadas exitosamente.` });
            setIsProcessing(false);
            setIsOpen(false);
            
            // FIX: Instead of reloading, call the onSuccess callback to let the parent component refetch data.
            // This avoids race conditions and provides a smoother user experience.
            onSuccess();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Un error desconocido ocurrió";
            toast({ variant: "destructive", title: "Error al procesar", description: errorMessage });
            setIsProcessing(false);
        }
    };

    const totalNetSalary = drafts.reduce((sum, draft) => sum + (draft.netSalary || 0), 0);
    const totalEmployees = drafts.length;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button disabled={drafts.length === 0}>Procesar Liquidaciones</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Procesamiento de Liquidaciones</DialogTitle>
                    <DialogDescription>
                        Estás a punto de procesar y centralizar las liquidaciones para el período. Esta acción es irreversible.
                    </DialogDescription>
                </DialogHeader>
                
                <div>
                    <h3 className="font-bold mb-2">Resumen del Proceso:</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><span className="font-semibold">Empresa:</span> {selectedCompany?.name}</li>
                        <li><span className="font-semibold">Número de empleados a procesar:</span> {totalEmployees}</li>
                        <li><span className="font-semibold">Monto líquido total a pagar:</span> {formatCurrency(totalNetSalary)}</li>
                    </ul>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isProcessing}>Cancelar</Button>
                    <Button onClick={handleProcess} disabled={isProcessing}>
                        {isProcessing ? 'Procesando...' : 'Confirmar y Procesar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
