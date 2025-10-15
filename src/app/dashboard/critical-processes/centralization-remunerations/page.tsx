
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"

  export default function CentralizationRemunerationsPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Centralización de Remuneraciones</CardTitle>
          <CardDescription>Genera el asiento contable a partir de las liquidaciones de sueldo procesadas.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                <h3 className="text-lg font-semibold">Generar Asiento de Centralización</h3>
                <p className="text-sm text-muted-foreground">Esta acción creará un comprobante de traspaso con el resumen de las remuneraciones del período seleccionado.</p>
                <Button>Centralizar Remuneraciones del Mes</Button>
            </div>
        </CardContent>
      </Card>
    )
  }
  