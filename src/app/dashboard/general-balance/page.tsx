
'use client';
import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";

  
  export default function GeneralBalancePage() {
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: new Date(new Date().getFullYear(), 0, 1),
        to: new Date(new Date().getFullYear(), 11, 31),
    });
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance General</CardTitle>
          <CardDescription>Consulta el balance general de la empresa para un período específico.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
                <div className="flex-1">
                    <DateRangePicker date={date} onDateChange={setDate} />
                </div>
                <Button>Generar Balance</Button>
            </div>
            <div className="border-t pt-4">
                 <p className="text-sm text-muted-foreground">Selecciona un período y haz clic en "Generar Balance" para visualizar el informe.</p>
            </div>
        </CardContent>
      </Card>
    )
  }
  
