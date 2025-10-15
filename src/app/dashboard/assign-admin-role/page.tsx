
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


export default function AssignAdminRolePage() {
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        toast({
            variant: 'destructive',
            title: 'Página Obsoleta',
            description: 'Esta página ya no se utiliza. Serás redirigido.',
        });
        router.replace('/dashboard');
    }, [router, toast]);
    

    return (
        <Card>
            <CardHeader>
                <CardTitle>Página no encontrada</CardTitle>
                <CardDescription>
                    Esta página ha sido eliminada. Serás redirigido al dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>Redirigiendo...</p>
            </CardContent>
        </Card>
    );
}

