
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
  import type { Employee } from "@/lib/types"
  
  export default function CertificadoRemuneracionesPage({ companyId }: { companyId?: string }) {
    const { data: employees, loading } = useCollection<Employee>({ 
        path: `companies/${companyId}/employees`,
        companyId: companyId 
    });

    return (
      <Card>
        <CardHeader>
          <CardTitle>Certificado de Remuneraciones</CardTitle>
          <CardDescription>Genera certificados de remuneraciones para los empleados.</CardDescription>
        </CardHeader>
        <CardContent>
            <form className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="employee">Empleado</Label>
                     <Select disabled={!companyId || loading}>
                        <SelectTrigger id="employee">
                            <SelectValue placeholder={!companyId ? "Selecciona una empresa primero" : (loading ? "Cargando empleados..." : "Selecciona un empleado")} />
                        </SelectTrigger>
                        <SelectContent>
                            {employees?.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</SelectItem>
                            ))}
                            {employees?.length === 0 && <SelectItem value="no-emp" disabled>No hay empleados en esta empresa</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input id="year" type="number" placeholder="Ej: 2023" defaultValue={new Date().getFullYear()} />
                </div>
                 <div className="md:col-span-2 flex justify-end">
                    <Button disabled={!companyId}>Generar Certificado</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    )
  }
  

