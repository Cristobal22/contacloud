
'use client';

import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Label } from "@/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

  export default function ArchivoPreviredPage() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = React.useState(currentYear.toString());
    const [month, setMonth] = React.useState(currentMonth.toString());

    return (
      <Card>
        <CardHeader>
          <CardTitle>Archivo Previred</CardTitle>
          <CardDescription>Genera el archivo para el pago de cotizaciones en Previred.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-dashed p-8 text-center max-w-lg mx-auto">
            <h3 className="text-lg font-semibold">Generación de Archivo</h3>
            <div className="w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
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
                    <div className="space-y-2 text-left">
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
                 <p className="text-sm text-muted-foreground text-left">
                    Esta función generará el archivo de carga para Previred basado en las liquidaciones procesadas del período seleccionado.
                </p>
            </div>
            <Button className="w-full">Generar Archivo</Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
