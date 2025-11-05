'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, PlusCircle } from 'lucide-react';
import type { Employee, Bono } from '@/lib/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface FixedBonusesSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
    setBonoDialogState: (state: { isOpen: boolean; bono: Partial<Bono>; index: number | null }) => void;
}

export function FixedBonusesSection({ employee, handleFieldChange, setBonoDialogState }: FixedBonusesSectionProps) {
    const handleRemoveBono = (i: number) => handleFieldChange('bonosFijos', (employee.bonosFijos || []).filter((_, idx) => idx !== i));

    return (
        <section id="fixed-bonuses" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">3. Bonos Fijos Imponibles</h3>
            <Card className="border-dashed">
                <CardContent className="pt-6">
                    {(employee.bonosFijos || []).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">No hay bonos fijos.</p>
                    ) : (
                        <Table>
                            <TableHeader><TableRow><TableHead>Glosa</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="w-[100px] text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {employee.bonosFijos?.map((bono, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{bono.glosa}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(bono.monto)}</TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="ghost" size="icon" onClick={() => setBonoDialogState({ isOpen: true, bono, index })}><Eye className="h-4 w-4" /></Button>
                                             <Button variant="ghost" size="icon" onClick={() => handleRemoveBono(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                <CardFooter>
                     <Button variant="outline" onClick={() => setBonoDialogState({ isOpen: true, bono: { glosa: '', monto: 0 }, index: null })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Agregar Bono
                    </Button>
                </CardFooter>
            </Card>
        </section>
    );
}