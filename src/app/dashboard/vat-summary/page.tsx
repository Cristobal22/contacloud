
'use client';
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
  
  export default function VatSummaryPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [summary, setSummary] = React.useState<any | null>(null);

    const handleGenerate = () => {
        setSummary({
            debit: 475000,
            credit: 285000,
            total: 190000
        });
    }

    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Mensual IVA</CardTitle>
            <CardDescription>Consulta el resumen mensual de IVA (Impuesto al Valor Agregado).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="month">Mes</Label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger id="month">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i+1} value={(i+1).toString()}>
                                        {new Date(0, i).toLocaleString('es-CL', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Año</Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="year">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                        {currentYear-i}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button onClick={handleGenerate}>Generar Resumen</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Resumen de IVA</CardTitle>
                 <CardDescription>
                    {summary ? `Resumen para ${new Date(parseInt(year), parseInt(month)-1).toLocaleString('es-CL', { month: 'long', year: 'numeric' })}` : "Aún no se ha generado ningún resumen."}
                 </CardDescription>
            </CardHeader>
            <CardContent>
                {!summary ? (
                    <p className="text-sm text-muted-foreground">Usa el generador para ver el resumen de IVA.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>IVA Débito Fiscal (Ventas)</TableCell>
                                <TableCell className="text-right">${summary.debit.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell>IVA Crédito Fiscal (Compras)</TableCell>
                                <TableCell className="text-right">- ${summary.credit.toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        </TableBody>
                        <TableFooter>
                            <TableRow className="font-bold text-lg">
                                <TableCell>{summary.total >= 0 ? "IVA a Pagar" : "Remanente Crédito Fiscal"}</TableCell>
                                <TableCell className="text-right">${Math.abs(summary.total).toLocaleString('es-CL')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                )}
            </CardContent>
        </Card>
      </div>
    )
  }
  
