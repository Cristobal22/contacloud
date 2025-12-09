'use client';

import { ColumnDef } from '@tanstack/react-table';
import type { VatProportionalityRecord } from '@/lib/types';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
const formatPercentage = (value: number) => new Intl.NumberFormat('es-CL', { style: 'percent', minimumFractionDigits: 2 }).format(value);

export const columns: ColumnDef<VatProportionalityRecord>[] = [
    {
        accessorKey: 'period',
        header: 'Período',
        cell: ({ row }) => {
            const record = row.original;
            const month = String(record.month).padStart(2, '0');
            return <span>{`${month}/${record.year}`}</span>;
        },
    },
    {
        accessorKey: 'proportionalityFactor',
        header: 'Factor Proporcionalidad',
        cell: ({ row }) => formatPercentage(row.original.proportionalityFactor),
    },
    {
        accessorKey: 'totalCreditoFiscal',
        header: 'Crédito Fiscal Total',
        cell: ({ row }) => formatCurrency(row.original.totalCreditoFiscal),
    },
    {
        accessorKey: 'totalVentas',
        header: 'Ventas del Período',
        cell: ({ row }) => formatCurrency(row.original.totalVentas),
    },
    {
        accessorKey: 'createdAt',
        header: 'Fecha de Cálculo',
        cell: ({ row }) => {
            const timestamp = row.original.createdAt as any;
            if (timestamp && typeof timestamp.toDate === 'function') {
                return new Date(timestamp.toDate()).toLocaleString('es-CL');
            }
            return 'Fecha no disponible';
        },
    },
];
