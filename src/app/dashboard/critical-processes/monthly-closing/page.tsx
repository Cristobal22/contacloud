
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

  export default function MonthlyClosingPage() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cierre Mensual</CardTitle>
          <CardDescription>Realiza el proceso de cierre contable mensual para bloquear el período.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                <Lock className="h-12 w-12 text-destructive"/>
                <h3 className="text-lg font-semibold">Proceso de Cierre</h3>
                <p className="text-sm text-muted-foreground">Al ejecutar el cierre, se bloquearán los movimientos del período para evitar modificaciones. Este proceso es irreversible.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Ejecutar Cierre Mensual</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción es irreversible. Al ejecutar el cierre mensual, todos los comprobantes y movimientos del período actual se bloquearán y no podrán ser modificados ni eliminados. Asegúrate de haber revisado toda la información antes de proceder.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className={buttonVariants({ variant: "destructive" })}>
                        Sí, ejecutar cierre
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
      </Card>
    )
  }
  
