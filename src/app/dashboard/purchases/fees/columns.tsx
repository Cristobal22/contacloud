'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Honorarium } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<Honorarium>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha',
  },
  {
    accessorKey: 'documentNumber',
    header: 'N° Boleta',
  },
  {
    accessorKey: 'issuerName',
    header: 'Emisor',
  },
  {
    accessorKey: 'issuerRut',
    header: 'RUT Emisor',
  },
  {
    accessorKey: 'grossAmount',
    header: () => <div className="text-right">Monto Bruto</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('grossAmount'));
      const formatted = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'retentionAmount',
    header: () => <div className="text-right">Monto Retenido</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('retentionAmount'));
      const formatted = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'netAmount',
    header: () => <div className="text-right">Monto Líquido</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('netAmount'));
      const formatted = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return <Badge variant={status === 'NULA' ? 'destructive' : 'default'}>{status}</Badge>;
    },
  },
];
