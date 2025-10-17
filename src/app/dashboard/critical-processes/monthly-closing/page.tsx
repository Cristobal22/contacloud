
'use client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Lock } from "lucide-react"
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SelectedCompanyContext } from "../../layout";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

  export default function MonthlyClosingPage() {
    const { selectedCompany } = React.useContext(SelectedCompanyContext) || {};
    const companyId = selectedCompany?.id;
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const periodEndDate = selectedCompany?.periodEndDate;
    // The ability to close should depend on having a company selected, not just the end date.
    // The logic inside will handle cases where the date isn't set.
    const canAttemptClose = !!selectedCompany;

    const handleClosePeriod = async () => {
        if (!firestore || !companyId || !periodEndDate) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "No se puede cerrar el período porque no hay una fecha de finalización definida para la empresa.",
            });
            return;
        }

        setIsProcessing(true);
        const companyRef = doc(firestore, 'companies', companyId);

        try {
            await updateDoc(companyRef, {
                lastClosedDate: periodEndDate
            });
            toast({
                title: "Período Cerrado Exitosamente",
                description: `Se ha bloqueado el período hasta el ${format(parseISO(periodEndDate), 'P', { locale: es })}.`,
            });
        } catch (error) {
            console.error("Error closing period:", error);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: companyRef.path,
                operation: 'update',
                requestResourceData: { lastClosedDate: periodEndDate },
            }));
        } finally {
            setIsProcessing(false);
        }
    };

    const formattedPeriod = periodEndDate ? format(parseISO(periodEndDate), "MMMM 'de' yyyy", { locale: es }) : "No definido";
    const lastClosedDate = selectedCompany?.lastClosedDate ? format(parseISO(selectedCompany.lastClosedDate), "P", { locale: es }) : "Ninguno";

    return (
      <Card>
        <CardHeader>
          <CardTitle>Cierre Mensual</CardTitle>
          <CardDescription>Realiza el proceso de cierre contable mensual para bloquear el período.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-8 text-center">
                <Lock className="h-12 w-12 text-destructive"/>
                <h3 className="text-lg font-semibold">Proceso de Cierre para <span className="text-primary">{selectedCompany?.name || '...'}</span></h3>
                <div className="text-sm text-muted-foreground">
                    <p>Período de trabajo actual finaliza el: <span className="font-bold">{periodEndDate ? format(parseISO(periodEndDate), "P", { locale: es }) : "No definido"}</span>.</p>
                    <p>Último cierre realizado el: <span className="font-bold">{lastClosedDate}</span>.</p>
                </div>
                <p className="max-w-md text-sm">
                    {periodEndDate 
                        ? `Al ejecutar el cierre, se actualizará la fecha del último cierre al ${format(parseISO(periodEndDate), "P", { locale: es })}. No se podrán crear ni modificar comprobantes con fecha anterior o igual a esta.`
                        : "Define un período de trabajo en la configuración de la empresa para poder ejecutar el cierre."
                    }
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!canAttemptClose || isProcessing}>
                        {isProcessing ? "Procesando..." : `Ejecutar Cierre para ${formattedPeriod}`}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {periodEndDate 
                          ? `Esta acción es irreversible. Al ejecutar el cierre mensual, se bloquearán todos los movimientos hasta el ${format(parseISO(periodEndDate), "P", { locale: es })}. Asegúrate de haber revisado toda la información antes de proceder.`
                          : "No se puede continuar porque no hay una fecha de fin de período definida."
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={handleClosePeriod}
                        disabled={!periodEndDate}
                      >
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
  
