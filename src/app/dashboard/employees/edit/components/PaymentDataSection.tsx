'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Employee, PaymentMethod } from '@/lib/types';

interface PaymentDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
}

const paymentMethods: PaymentMethod[] = ['Efectivo', 'Depósito en Cta. Cte./Vista', 'Vale Vista', 'Cheque'];

export function PaymentDataSection({ employee, handleFieldChange }: PaymentDataSectionProps) {
    const isBankTransfer = employee.paymentMethod === 'Depósito en Cta. Cte./Vista';

    return (
        <section id="payment-data" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">9. Datos de Pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2 col-span-1">
                    <Label>Forma de Pago</Label>
                    <Select value={employee.paymentMethod || ''} onValueChange={v => handleFieldChange('paymentMethod', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                            {paymentMethods.map(method => (
                                <SelectItem key={method} value={method}>{method}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                {isBankTransfer && (
                    <>
                        <div className="space-y-2 col-span-1">
                            <Label>Banco</Label>
                            <Input 
                                value={employee.bank || ''} 
                                onChange={e => handleFieldChange('bank', e.target.value)} 
                                placeholder="Ej: Banco de Chile"
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Tipo de Cuenta</Label>
                            <Input 
                                value={employee.accountType || ''} 
                                onChange={e => handleFieldChange('accountType', e.target.value)} 
                                placeholder="Ej: Cuenta Corriente"
                            />
                        </div>
                        <div className="space-y-2 col-span-1">
                            <Label>Número de Cuenta</Label>
                            <Input 
                                value={employee.accountNumber || ''} 
                                onChange={e => handleFieldChange('accountNumber', e.target.value)} 
                            />
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}