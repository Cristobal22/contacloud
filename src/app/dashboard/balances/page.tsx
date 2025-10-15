
'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import React from "react";
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

  
  export default function BalancesPage() {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    });
    const [generatedBalance, setGeneratedBalance] = React.useState<any[] | null>(null);

    const handleGenerate = () => {
        // Mock balance generation
        setGeneratedBalance([
            { code: '1.1.01', name: 'Caja', debit: 1500000, credit: 500000, balance: 1000000 },
            { code: '1.2.01', name: 'Clientes', debit: 2500000, credit: 1200000, balance: 1300000 },
            { code: '2.1.01', name: 'Proveedores', debit: 800000, credit: 1800000, balance: -1000000 },
            { code: '3.1.01', name: 'Capital', debit: 0, credit: 1300000, balance: -1300000 },
        ]);
    }

    const totals = React.useMemo(() => {
        if (!generatedBalance) return { debit: 0, credit: 0 };
        return generatedBalance.reduce((acc, row) => ({
            debit: acc.debit + row.debit,
            credit: acc.credit + row.credit,
        }), { debit: 0, credit: 0 });
    }, [generatedBalance]);

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Generador de Balances</CardTitle>
                <CardDescription>Selecciona un período para generar un balance contable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                             <DateRangePicker date={date} onDateChange={setDate} />
                        </div>
                        <Button onClick={handleGenerate}>Generar Balance</Button>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Último Balance Generado</CardTitle>
                    <CardDescription>
                         {generatedBalance && date?.from && date?.to ? 
                            `Balance de 8 columnas para el período del ${format(date.from, "P", { locale: es })} al ${format(date.to, "P", { locale: es })}.` 
                            : "Aún no se ha generado ningún balance."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {!generatedBalance ? (
                        <p className="text-sm text-muted-foreground">Utiliza el generador para crear tu primer balance.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Cuenta</TableHead>
                                    <TableHead className="text-right">Debe</TableHead>
                                    <TableHead className="text-right">Haber</TableHead>
                                    <TableHead className="text-right font-bold">Saldo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedBalance.map(row => (
                                    <TableRow key={row.code}>
                                        <TableCell>{row.code}</TableCell>
                                        <TableCell>{row.name}</TableCell>
                                        <TableCell className="text-right">${row.debit.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right">${row.credit.toLocaleString('es-CL')}</TableCell>
                                        <TableCell className="text-right font-bold">${row.balance.toLocaleString('es-CL')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <CardFooter>
                                <TableRow>
                                    <TableCell colSpan={2} className="font-bold">Totales</TableCell>
                                    <TableCell className="text-right font-bold">${totals.debit.toLocaleString('es-CL')}</TableCell>
                                    <TableCell className="text-right font-bold">${totals.credit.toLocaleString('es-CL')}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </CardFooter>
                        </Table>
                    )}
                </CardContent>
            </Card>
      </div>
    )
  }
  
