import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Upload } from "lucide-react"
  
  export default function BankReconciliationPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Conciliación Bancaria</CardTitle>
                <CardDescription>Compara los movimientos de tu banco con tus registros contables.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <h3 className="text-sm font-medium mb-2">Cargar Cartola Bancaria</h3>
                             <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Cargar Archivo
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">Sube el archivo de tu cartola bancaria para iniciar el proceso.</p>
                        </div>
                        <Button>Iniciar Conciliación</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Estado de Conciliación</CardTitle>
                    <CardDescription>Aún no se ha realizado ninguna conciliación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Utiliza el cargador de archivos para iniciar tu primera conciliación.</p>
                </CardContent>
            </Card>
      </div>
    )
  }
  