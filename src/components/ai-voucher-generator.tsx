'use client'
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { Label } from "./ui/label";

interface AIVoucherGeneratorProps {
    onGenerate: (prompt: string) => void;
    isLoading: boolean;
}

export function AIVoucherGenerator({ onGenerate, isLoading }: AIVoucherGeneratorProps) {
    const [prompt, setPrompt] = React.useState('');

    const handleGenerate = () => {
        if (prompt.trim()) {
            onGenerate(prompt.trim());
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Asistente de IA para Comprobantes</CardTitle>
                <CardDescription>Describe la transacción y la IA generará los asientos contables por ti.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Descripción de la Transacción</Label>
                    <Textarea 
                        id="ai-prompt"
                        placeholder="Ej: Se paga la factura de electricidad #456 por $35.000 desde la cuenta corriente del Banco de Chile."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        {isLoading ? 'Generando...' : 'Generar Asientos'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
