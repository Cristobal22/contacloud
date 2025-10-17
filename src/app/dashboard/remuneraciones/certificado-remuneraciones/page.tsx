'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { useCollection } from "@/firebase"
  import type { Employee, Payroll } from "@/lib/types"
import React from "react";
import { SelectedCompanyContext } from "../../layout";
import { useToast } from "@/hooks/use-toast"
  
  export default function CertificadoRemuneracionesPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const { toast } = useToast();

    const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string>("");
    const [year, setYear] = React.useState(new Date().getFullYear().toString());
    const [isGenerating, setIsGenerating] = React.useState(false);

    const { data: employees, loading: employeesLoading } = useCollection<Employee>({ 
        path: companyId ? `companies/${companyId}/employees` : undefined,
        companyId: companyId 
    });

    const { data: payrolls, loading: payrollsLoading } = useCollection<Payroll>({ 
      path: `companies/${companyId}/payrolls`, 
      companyId: companyId 
    });

    const loading = employeesLoading || payrollsLoading;

    const handleGenerateCertificate = () => {
        setIsGenerating(true);

        if (!selectedEmployeeId) {
            toast({ variant: "destructive", title: "Error", description: "Por favor, selecciona un empleado." });
            setIsGenerating(false);
            return;
        }

        const employee = employees?.find(e => e.id === selectedEmployeeId);
        const selectedYear = parseInt(year);

        const employeePayrolls = payrolls?.filter(p => p.employeeId === selectedEmployeeId && p.year === selectedYear);

        if (!employee || !employeePayrolls || employeePayrolls.length === 0) {
            toast({ variant: "destructive", title: "Sin Datos", description: `No se encontraron liquidaciones para ${employee?.firstName || 'el empleado'} en el año ${year}.` });
            setIsGenerating(false);
            return;
        }

        const totalTaxable = employeePayrolls.reduce((sum, p) => sum + p.taxableEarnings, 0);
        const totalAfp = employeePayrolls.reduce((sum, p) => sum + p.afpDiscount, 0);
        const totalHealth = employeePayrolls.reduce((sum, p) => sum + p.healthDiscount, 0);
        
        let certificateContent = `
CERTIFICADO DE REMUNERACIONES
----------------------------------

EMPRESA: ${selectedCompany?.name || 'No especificada'}
RUT EMPRESA: ${selectedCompany?.rut || 'No especificado'}

EMPLEADO: ${employee.firstName} ${employee.lastName}
RUT EMPLEADO: ${employee.rut}

AÑO: ${year}
----------------------------------

Se certifica que el trabajador individualizado anteriormente ha percibido las siguientes remuneraciones y ha efectuado las siguientes cotizaciones previsionales durante el año ${year}:

RENTA TOTAL IMPONIBLE: $${totalTaxable.toLocaleString('es-CL')}
COTIZACIÓN AFP PAGADA: $${totalAfp.toLocaleString('es-CL')}
COTIZACIÓN SALUD PAGADA: $${totalHealth.toLocaleString('es-CL')}

Este certificado se extiende a petición del interesado para los fines que estime convenientes.

Fecha de emisión: ${new Date().toLocaleDateString('es-CL')}
`;
        
        const blob = new Blob([certificateContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `certificado_${employee.rut}_${year}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({ title: "Certificado Generado", description: "El certificado ha sido descargado." });
        setIsGenerating(false);
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificado de Remuneraciones</CardTitle>
          <CardDescription>Genera certificados de remuneraciones para los empleados.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-6 md:grid-cols-2 max-w-lg">
                <div className="space-y-2">
                    <Label htmlFor="employee">Empleado</Label>
                     <Select 
                        value={selectedEmployeeId} 
                        onValueChange={setSelectedEmployeeId} 
                        disabled={!companyId || loading || isGenerating}
                    >
                        <SelectTrigger id="employee">
                            <SelectValue placeholder={!companyId ? "Selecciona una empresa" : (loading ? "Cargando..." : "Selecciona un empleado")} />
                        </SelectTrigger>
                        <SelectContent>
                            {employees?.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                            ))}
                            {!loading && employees?.length === 0 && <SelectItem value="no-emp" disabled>No hay empleados</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input 
                        id="year" 
                        type="number" 
                        placeholder="Ej: 2023" 
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        disabled={isGenerating}
                    />
                </div>
                 <div className="md:col-span-2 flex justify-end">
                    <Button 
                        disabled={!companyId || loading || isGenerating} 
                        onClick={handleGenerateCertificate}
                    >
                       {loading ? "Cargando..." : (isGenerating ? "Generando..." : "Generar Certificado")}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    )
  }
  
