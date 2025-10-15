
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"

  export default function CentralizationRcvPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Centralización RCV (SII)</CardTitle>
          <CardDescription>Centraliza automáticamente el Registro de Compras y Ventas desde el SII.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                <h3 className="text-lg font-semibold">Iniciar Proceso de Centralización</h3>
                <p className="text-sm text-muted-foreground">Esta acción se conectará al SII para obtener los documentos del mes y generar los asientos contables correspondientes.</p>
                <Button>Centralizar Mes Actual</Button>
            </div>
        </CardContent>
      </Card>
    )
  }
  