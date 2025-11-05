
'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bono, PayrollDraft } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Math.round(value));

interface VariableBonosManagerProps {
    draft: PayrollDraft;
    onUpdate: (bonos: Bono[]) => void;
    children: React.ReactNode;
}

export function VariableBonosManager({ draft, onUpdate, children }: VariableBonosManagerProps) {
    const [bonos, setBonos] = React.useState<Bono[]>(draft.variableBonos || []);
    const [glosa, setGlosa] = React.useState('');
    const [monto, setMonto] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        // Ensure the internal state is updated if the parent's draft changes
        setBonos(draft.variableBonos || []);
    }, [draft.variableBonos]);

    const handleAdd = () => {
        if (!glosa || monto <= 0) return;
        const newBonos = [...bonos, { glosa, monto }];
        setBonos(newBonos);
        onUpdate(newBonos);
        setGlosa('');
        setMonto(0);
    };

    const handleRemove = (index: number) => {
        const newBonos = bonos.filter((_, i) => i !== index);
        setBonos(newBonos);
        onUpdate(newBonos);
    };
    
    const totalBonos = bonos.reduce((sum, bono) => sum + bono.monto, 0);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bonos Variables del Mes para {draft.employeeName}</DialogTitle>
                    <DialogDescription>Agrega los bonos imponibles que aplican solo para este período.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex gap-2">
                        <Input placeholder="Glosa (Ej: Bono de Producción)" value={glosa} onChange={(e) => setGlosa(e.target.value)} />
                        <Input type="number" placeholder="Monto" value={monto || ''} onChange={(e) => setMonto(parseFloat(e.target.value) || 0)} />
                        <Button onClick={handleAdd}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                        {bonos.map((bono, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <span>{bono.glosa}</span>
                                <div className="flex items-center gap-2">
                                    <span>{formatCurrency(bono.monto)}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="font-bold text-right">Total Bonos Variables: {formatCurrency(totalBonos)}</div>
                </div>
                 <DialogFooter>
                    <Button onClick={() => setIsOpen(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
