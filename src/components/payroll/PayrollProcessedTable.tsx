
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Download, Trash2 } from 'lucide-react';
import { Payroll } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface PayrollProcessedTableProps {
    companyId: string;
    payrolls: Payroll[];
    onAnnulSuccess: (payrollId: string) => void;
    onPreview: (payroll: Payroll) => void;
    onDownload: (payroll: Payroll) => void;
    onDownloadAll: () => void;
}

export function PayrollProcessedTable({ companyId, payrolls, onAnnulSuccess, onPreview, onDownload, onDownloadAll }: PayrollProcessedTableProps) {
    const { toast } = useToast();
    const { user, loading: userLoading } = useUser();
    const [isAnnulDialogOpen, setIsAnnulDialogOpen] = React.useState(false);
    const [selectedPayroll, setSelectedPayroll] = React.useState<Payroll | null>(null);
    const [isAnnulling, setIsAnnulling] = React.useState(false);

    const openAnnulDialog = (payroll: Payroll) => {
        setSelectedPayroll(payroll);
        setIsAnnulDialogOpen(true);
    };

    const handleAnnulConfirm = async (payrollId: string) => {
        if (!payrollId || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener el ID de la liquidación. Por favor, recargue la página.' });
            return;
        }

        setIsAnnulling(true);
        toast({ title: 'Anulando liquidación...' });

        try {
            const token = await user.getIdToken(true);
            if (!token) {
                throw new Error('No se pudo obtener un token de autenticación válido.');
            }

            const url = `/api/payrolls/${payrollId}?empresaId=${companyId}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server error response:', errorData);
                throw new Error(`Error del servidor: ${response.statusText} (${response.status}).`);
            }

            toast({ title: 'Éxito', description: 'La liquidación ha sido anulada.' });
            onAnnulSuccess(payrollId);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error en la anulación', description: error.message });
        } finally {
            setIsAnnulling(false);
            setIsAnnulDialogOpen(false);
            setSelectedPayroll(null);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Liquidaciones Procesadas</h3>
                <Button onClick={onDownloadAll} size="sm" disabled={userLoading}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Todos los PDF
                </Button>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead className="text-right">Sueldo Base</TableHead>
                            <TableHead className="text-right">Total Haberes</TableHead>
                            <TableHead className="text-right">Total Descuentos</TableHead>
                            <TableHead className="text-right font-bold">Sueldo Líquido</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payrolls.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.employeeName}</TableCell>
                                <TableCell className="text-right">{formatCurrency(p.baseSalary)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(p.totalEarnings || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(p.totalDiscounts || 0)}</TableCell>
                                <TableCell className="text-right font-bold">{formatCurrency(p.netSalary || 0)}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => onPreview(p)} disabled={userLoading}>Vista Previa</Button>
                                    <Button variant="outline" size="sm" onClick={() => onDownload(p)} disabled={userLoading}><Download className="h-4 w-4" /></Button>
                                    <Button variant="destructive" size="sm" onClick={() => openAnnulDialog(p)} disabled={userLoading}><Trash2 className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={isAnnulDialogOpen} onOpenChange={setIsAnnulDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de anular esta liquidación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es irreversible y eliminará la liquidación de <span className="font-bold">{selectedPayroll?.employeeName}</span>.
                            Si existe un comprobante contable asociado, será revertido al estado 'Borrador'.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isAnnulling}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => selectedPayroll && handleAnnulConfirm(selectedPayroll.id)} disabled={isAnnulling}>
                            {isAnnulling ? 'Anulando...' : 'Confirmar Anulación'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
