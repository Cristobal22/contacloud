
'use client';

import React from 'react';
import { useCollection } from '@/firebase';
import type { EconomicIndicator, AfpEntity, TaxableCap } from '@/lib/types';
import { StatusCard } from './StatusCard';
import { subMonths, addMonths, startOfMonth } from 'date-fns';
import { DataLoader } from './DataLoader';


interface HealthCheckResult {
    name: string;
    status: 'ok' | 'missing' | 'partial';
    message: string;
    action?: React.ReactNode;
}

export function HealthCheckLogic() {
    const { data: indicators, loading: indicatorsLoading, refetch: refetchIndicators } = useCollection<EconomicIndicator>({ path: 'economic-indicators' });
    const { data: afpEntities, loading: afpLoading, refetch: refetchAfp } = useCollection<AfpEntity>({ path: 'afp-entities' });
    const { data: taxableCaps, loading: capsLoading, refetch: refetchCaps } = useCollection<TaxableCap>({ path: 'taxable-caps' });

    const loading = indicatorsLoading || afpLoading || capsLoading;

    const runChecks = (): HealthCheckResult[] => {
        if (loading) return [];

        const checks: HealthCheckResult[] = [];
        const currentDate = startOfMonth(new Date());
        const periodsToCheck = [
            subMonths(currentDate, 1),
            currentDate,
            addMonths(currentDate, 1),
        ];

        // 1. Economic Indicators Check
        periodsToCheck.forEach(date => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const periodId = `${year}-${String(month).padStart(2, '0')}`;
            const found = indicators?.some(ind => ind.id === periodId && ind.uf > 0 && ind.utm > 0);
            checks.push({
                name: `Indicadores Económicos (${month}/${year})`,
                status: found ? 'ok' : 'missing',
                message: found ? 'Datos cargados y válidos.' : 'Faltan datos de UF/UTM para este período.',
                action: !found ? <DataLoader dataType="economic-indicators" filter={{ year, month }} onSuccess={refetchIndicators} /> : undefined,
            });
        });

        // 2. AFP Entities Check
        periodsToCheck.forEach(date => {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const found = afpEntities?.some(afp => afp.year === year && afp.month === month);
            checks.push({
                name: `Entidades AFP (${month}/${year})`,
                status: found ? 'ok' : 'missing',
                message: found ? 'Datos cargados.' : 'Faltan entidades de AFP para este período.',
                action: !found ? <DataLoader dataType="afp-entities" filter={{ year, month }} onSuccess={refetchAfp} /> : undefined,
            });
        });

        // 3. Taxable Caps Check
        const currentYear = new Date().getFullYear();
        const foundCap = taxableCaps?.some(cap => cap.id === currentYear.toString() && cap.afpCap > 0);
        checks.push({
            name: `Topes Imponibles (${currentYear})`,
            status: foundCap ? 'ok' : 'missing',
            message: foundCap ? 'Datos cargados y válidos.' : 'Faltan los topes imponibles para el año actual.',
            action: !foundCap ? <DataLoader dataType="taxable-caps" filter={{ year: currentYear }} onSuccess={refetchCaps} /> : undefined,
        });

        return checks;
    };

    const checkResults = runChecks();

    if (loading) {
        return <p>Realizando diagnóstico...</p>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkResults.map((result, index) => (
                <StatusCard key={index} result={result} />
            ))}
        </div>
    );
}
