'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Employee, Payroll } from "@/lib/types"
import { useCollection } from '@/firebase';
import { query, collection, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Eye } from 'lucide-react';
import { PayrollDetailDialog } from './payroll-detail-dialog';

interface HistoricalPayrollDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    companyId: string | undefined;
}

export function HistoricalPayrollDialog({ isOpen, onClose, employee, companyId }: HistoricalPayrollDialogProps) {
    const firestore = useFirestore();
    const [selectedPayroll, setSelectedPayroll] = React.useState<Payroll | null>(null);

    const payrollsQuery = React.useMemo(() => {
        if (!firestore || !companyId || !employee) return null;
        return query(
            collection(firestore, `companies/${companyId}/payrolls`),
            where('employeeId', '==', employee.id)
        );
    }, [firestore, companyId, employee]);

    const { data: payrolls, loading } = useCollection<Payroll>({ 
        query: payrollsQuery,
        disabled: !payrollsQuery
    });

    const handleViewDetails = (payroll: Payroll) => {
        if (employee) {
            setSelectedPayroll(payroll);
        }
    };
    
    if (!employee) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Historial de Liquidaciones</DialogTitle>
                        <DialogDescription>
                            Mostrando todas las liquidaciones procesadas para {employee.firstName} {employee.lastName}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Período</TableHead>
                                    <TableHead className="text-right">Sueldo Líquido</TableHead>
                                    <TableHead className="text-center">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && <TableRow><TableCell colSpan={3} className="text-center">Cargando...</TableCell></TableRow>}
                                {!loading && payrolls && payrolls.length > 0 ? (
                                    payrolls.sort((a,b) => b.period.localeCompare(a.period)).map(payroll => (
                                        <TableRow key={payroll.id}>
                                            <TableCell>{payroll.period}</TableCell>
                                            <TableCell className="text-right font-medium">${Math.round(payroll.netSalary).toLocaleString('es-CL')}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="ghost" size="icon" onClick={() => handleViewDetails(payroll)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    !loading && <TableRow><TableCell colSpan={3} className="text-center">No se encontraron liquidaciones para este empleado.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {selectedPayroll && (
                <PayrollDetailDialog
                    isOpen={!!selectedPayroll}
                    onClose={() => setSelectedPayroll(null)}
                    data={{ payroll: selectedPayroll, employee: employee }}
                />
            )}
        </>
    )
}
