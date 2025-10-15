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
  import { mockEmployees } from "@/lib/data"
  
  export default function CertificadoRemuneracionesPage() {
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
                     <Select>
                        <SelectTrigger id="employee">
                            <SelectValue placeholder="Selecciona un empleado" />
                        </SelectTrigger>
                        <SelectContent>
                            {mockEmployees.map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Input id="year" type="number" placeholder="Ej: 2023" defaultValue={new Date().getFullYear()} />
                </div>
                 <div className="md:col-span-2 flex justify-end">
                    <Button>Generar Certificado</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    )
  }
  