'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { SelectedCompanyContext } from '../../layout';
import { useCollection } from '@/firebase';
import type { Payroll } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
  
  export default function LibroRemuneracionesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isGenerating, setIsGenerating] = React.useState(false);

    const { data: payrolls, loading } = useCollection<Payroll>({ 
      path: `companies/${companyId}/payrolls`, 
      companyId: companyId 
    });


    const handleGenerateBook = () => {
        setIsGenerating(true);
        const selectedYear = parseInt(year);
        const selectedMonth = parseInt(month);
        
        const periodPayrolls = payrolls?.filter(p => p.year === selectedYear && p.month === selectedMonth);

        if (!periodPayrolls || periodPayrolls.length === 0) {
            toast({
                variant: "destructive",
                title: "Sin Datos",
                description: "No hay liquidaciones procesadas para generar el libro de este período."
            });
            setIsGenerating(false);
            return;
        }

        const headers = [
            'Nombre', 'Periodo', 'Sueldo Base', 'Gratificacion', 'Haberes Imponibles',
            'Haberes No Imponibles', 'Total Haberes', 'Descuento AFP', 'Descuento Salud',
            'Total Descuentos', 'Sueldo Liquido'
        ];

        const csvRows = [headers.join(',')];

        periodPayrolls.forEach(p => {
            const row = [
                p.employeeName,
                p.period,
                p.baseSalary.toFixed(0),
                p.gratification.toFixed(0),
                p.taxableEarnings.toFixed(0),
                p.nonTaxableEarnings.toFixed(0),
                p.totalEarnings.toFixed(0),
                p.afpDiscount.toFixed(0),
                p.healthDiscount.toFixed(0),
                p.totalDiscounts.toFixed(0),
                p.netSalary.toFixed(0)
            ].join(',');
            csvRows.push(row);
        });

        const csvContent = csvRows.join('\r\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `lre_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsGenerating(false);
        toast({
            title: "Libro Generado",
            description: "El Libro de Remuneraciones Electrónico ha sido descargado."
        });
    };

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Libro de Remuneraciones Electrónico</CardTitle>
                <CardDescription>Genera el libro de remuneraciones en formato electrónico para la Dirección del Trabajo (DT).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Mes</Label>
                                <Select value={month} onValueChange={setMonth} disabled={!companyId || loading || isGenerating}>
                                    <SelectTrigger id="month">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <SelectItem key={i+1} value={(i+1).toString()}>
                                                {format(new Date(0, i), 'MMMM', { locale: es })}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Año</Label>
                                <Select value={year} onValueChange={setYear} disabled={!companyId || loading || isGenerating}>
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
                        <Button disabled={!companyId || loading || isGenerating} onClick={handleGenerateBook}>
                            {loading ? "Cargando..." : (isGenerating ? "Generando..." : "Generar Libro")}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Libros Generados</CardTitle>
                    <CardDescription>
                        {!companyId ? "Selecciona una empresa para ver el historial." : "Aún no se ha generado ningún libro."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Utiliza el generador para crear tu primer libro de remuneraciones.</p>
                </CardContent>
            </Card>
      </div>
    )
  }
  
