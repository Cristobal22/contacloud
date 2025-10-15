
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import { Button } from "@/components/ui/button"

  export default function MonthlyParametersPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parámetros Mensuales</CardTitle>
          <CardDescription>Gestiona los parámetros mensuales para los cálculos contables y de remuneraciones (ej. UTM, UF).</CardDescription>
        </CardHeader>
        <CardContent>
            <form className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="uf">Valor UF del mes</Label>
                    <Input id="uf" type="number" placeholder="Ingresa el valor de la UF" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="utm">Valor UTM del mes</Label>
                    <Input id="utm" type="number" placeholder="Ingresa el valor de la UTM" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sueldo-minimo">Sueldo Mínimo</Label>
                    <Input id="sueldo-minimo" type="number" placeholder="Ingresa el sueldo mínimo" />
                </div>
                 <div className="md:col-span-2 flex justify-end">
                    <Button>Guardar Parámetros</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    )
  }
  