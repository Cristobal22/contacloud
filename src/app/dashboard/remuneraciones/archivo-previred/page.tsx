'use client';

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Label } from "@/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectedCompanyContext } from "../../layout";
import { useCollection } from "@/firebase";
import type { AfpEntity, Employee, HealthEntity, Payroll } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

  export default function ArchivoPreviredPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const { toast } = useToast();

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());
    const [isGenerating, setIsGenerating] = React.useState(false);

    const { data: payrolls, loading: payrollsLoading } = useCollection<Payroll>({ 
        path: `companies/${companyId}/payrolls`, 
        companyId: companyId 
    });
     const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
      path: `companies/${companyId}/employees`, 
      companyId: companyId 
    });
    const { data: afpEntities, loading: afpLoading } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: healthEntities, loading: healthLoading } = useCollection<HealthEntity>({ path: 'health-entities' });

    const loading = payrollsLoading || employeesLoading || afpLoading || healthLoading;

    const handleGenerateFile = () => {
      setIsGenerating(true);
      const selectedYear = parseInt(year);
      const selectedMonth = parseInt(month);

      const periodPayrolls = payrolls?.filter(p => p.year === selectedYear && p.month === selectedMonth);

      if (!periodPayrolls || periodPayrolls.length === 0) {
        toast({
            variant: "destructive",
            title: "Sin Datos",
            description: "No hay liquidaciones procesadas para el período seleccionado."
        });
        setIsGenerating(false);
        return;
      }
      
      const afpMap = new Map(afpEntities?.map(e => [e.name, e.previredCode]));
      const healthMap = new Map(healthEntities?.map(e => [e.name, e.previredCode]));

      let fileContent = "";
      
      periodPayrolls.forEach(payroll => {
        const employee = employees?.find(e => e.id === payroll.employeeId);
        if (!employee) return;
        
        const rut = employee.rut.replace(/[.-]/g, '');
        const rutDigits = rut.slice(0, -1).padStart(11, '0');
        const rutDV = rut.slice(-1).toUpperCase();

        const afpCode = employee.afp ? afpMap.get(employee.afp) || '' : '';
        const healthCode = employee.healthSystem ? healthMap.get(employee.healthSystem) || '' : '';

        const line = [
          rutDigits, // RUT
          rutDV, // DV
          employee.lastName, // Apellido Paterno (usamos todo el apellido)
          '', // Apellido Materno
          employee.firstName, // Nombres
          'M', // Sexo (M/F) - Placeholder
          employee.nationality || 'CHI', // Nacionalidad
          '01', // Tipo de Pago (01: Transferencia)
          format(new Date(year, month - 1, 1), 'yyyy-MM-dd'), // Período
          '0', // Régimen Previsional (0: AFP, 1: INP)
          payroll.taxableEarnings.toFixed(0), // Renta Imponible
          'S', // Cotiza AFP (S/N)
          afpCode, // Código AFP
          '0', // Renta Imponible AFP
          '0', // Cotización Obligatoria AFP
          'N', // Ahorro Voluntario
          '0', // Monto Ahorro Voluntario
          '0', // Renta Imponible Sustitutiva
          'S', // Cotiza Salud
          healthCode, // Código Salud
          '01', // Moneda Plan Salud (01: $, 02: UF)
          '0', // Cotización Pactada
          '0', // Cotización Obligatoria Salud
          '0', // Cotización Adicional Voluntaria
          '0', // Renta Imponible S. Cesantía
          'S', // Afiliado S. Cesantía
        ].join(';');
        fileContent += line + '\r\n';
      });

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `previred_${year}_${month}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);

       toast({
            title: "Archivo Generado",
            description: "El archivo de Previred ha sido descargado."
        });

    };


    return (
      <Card>
        <CardHeader>
          <CardTitle>Archivo Previred</CardTitle>
          <CardDescription>Genera el archivo para el pago de cotizaciones en Previred.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-8 text-center max-w-lg mx-auto">
            <h3 className="text-lg font-semibold">Generación de Archivo</h3>
            <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                        <Label htmlFor="month">Mes</Label>
                        <Select value={month} onValueChange={setMonth} disabled={!companyId || isGenerating || loading}>
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
                    <div className="space-y-2 text-left">
                        <Label htmlFor="year">Año</Label>
                        <Select value={year} onValueChange={setYear} disabled={!companyId || isGenerating || loading}>
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
                 <p className="text-sm text-muted-foreground text-left">
                    Esta función generará el archivo de carga para Previred basado en las liquidaciones procesadas del período seleccionado.
                </p>
            </div>
            <Button className="w-full" disabled={!companyId || isGenerating || loading} onClick={handleGenerateFile}>
                {loading ? "Cargando datos..." : (isGenerating ? "Generando..." : "Generar Archivo")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
