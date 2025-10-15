'use client'
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";

export function AIVoucherGenerator() {

    return (
        <Card className="bg-muted/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Wand2 className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle>Asistente de IA para Comprobantes (Próximamente)</CardTitle>
                        <CardDescription>Esta función te permitirá describir una transacción y la IA generará los asientos contables por ti.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-dashed p-4">
                     <p className="text-sm text-muted-foreground">La generación de comprobantes con IA está en construcción.</p>
                     <Button disabled>Generar Asientos</Button>
                </div>
            </CardContent>
        </Card>
    );
}
