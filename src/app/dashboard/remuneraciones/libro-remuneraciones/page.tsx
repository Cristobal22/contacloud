import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { DateRangePicker } from "@/components/date-range-picker"
  
  export default function LibroRemuneracionesPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Libro de Remuneraciones Electrónico</CardTitle>
                <CardDescription>Genera el libro de remuneraciones en formato electrónico para la Dirección del Trabajo (DT).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                             <p className="text-sm font-medium mb-2">Período de Remuneraciones</p>
                            <DateRangePicker className="w-full" />
                        </div>
                        <Button>Generar Libro</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Libros Generados</CardTitle>
                    <CardDescription>Aún no se ha generado ningún libro.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Utiliza el generador para crear tu primer libro de remuneraciones.</p>
                </CardContent>
            </Card>
      </div>
    )
  }
  