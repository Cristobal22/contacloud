
'use client';
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
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import React from "react";

  export default function MonthlyParametersPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());

    return (
      <Card>
        <CardHeader>
          <CardTitle>Parámetros Mensuales</CardTitle>
          <CardDescription>Gestiona los parámetros mensuales para los cálculos contables y de remuneraciones (ej. UTM, UF).</CardDescription>
        </CardHeader>
        <CardContent>
            <form className="grid gap-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="month">Mes</Label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger id="month">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i+1} value={(i+1).toString()}>
                                        {new Date(0, i).toLocaleString('es-CL', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Año</Label>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger id="year">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 5 }, (_, i) => (
                                    <SelectItem key={currentYear-i} value={(currentYear-i).toString()}>
                                        {currentYear-i}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="grid gap-6 md:grid-cols-3">
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
                </div>
                 <div className="flex justify-end">
                    <Button>Guardar Parámetros</Button>
                </div>
            </form>
        </CardContent>
      </Card>
    )
  }
  
