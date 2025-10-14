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
  import { Textarea } from "@/components/ui/textarea"
  import { Upload } from "lucide-react"
  
  export default function PayrollPage() {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Centralización de Remuneraciones</CardTitle>
            <CardDescription>Carga y procesa los datos de remuneraciones para la centralización.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="payroll-file">Archivo de Remuneraciones</Label>
                <div className="flex items-center gap-3">
                    <Input id="payroll-file" type="file" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('payroll-file')?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Elegir Archivo
                    </Button>
                    <span className="text-sm text-muted-foreground">Ningún archivo seleccionado</span>
                </div>
                <p className="text-xs text-muted-foreground">Sube un archivo CSV, XLSX, o XML con los datos de la nómina.</p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" placeholder="Ej: Remuneraciones Octubre 2023" />
              </div>
              <div className="flex justify-end">
                <Button>Procesar Nómina</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Historial de Procesamiento</CardTitle>
                <CardDescription>Revisa el estado de las cargas de nómina anteriores.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Aún no hay historial de procesamiento.</p>
            </CardContent>
        </Card>
      </div>
    )
  }
  