
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"

  
  export default function BalancesPage() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                <CardTitle>Generador de Balances</CardTitle>
                <CardDescription>Selecciona un período para generar un balance contable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <DateRangePicker className="w-full" />
                        </div>
                        <Button>Generar Balance</Button>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Último Balance Generado</CardTitle>
                    <CardDescription>Aún no se ha generado ningún balance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Utiliza el generador para crear tu primer balance.</p>
                </CardContent>
            </Card>
      </div>
    )
  }
  