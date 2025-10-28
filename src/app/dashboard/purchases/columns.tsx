'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Purchase, OtherTax } from '@/lib/types';

export const columns: ColumnDef<Purchase>[] = [
  {
    accessorKey: 'date',
    header: 'Fecha',
  },
  {
    accessorKey: 'documentType',
    header: 'Tipo de Documento',
  },
  {
    accessorKey: 'documentNumber',
    header: 'Nro. Documento',
  },
  {
    accessorKey: 'supplier',
    header: 'Proveedor',
  },
  {
    accessorKey: 'netAmount',
    header: 'Neto',
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
    accessorKey: 'taxAmount',
    header: 'IVA',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('taxAmount'));
      const formatted = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'otherTaxes',
    header: 'Otros Impuestos',
    cell: ({ row }) => {
      const otherTaxes = row.getValue('otherTaxes') as OtherTax[] | undefined;

      if (!otherTaxes || otherTaxes.length === 0) {
        return <div className="text-right font-medium">$0</div>;
      }

      const totalOtherTaxes = otherTaxes.reduce(
        (acc, tax) => acc + tax.amount,
        0
      );
      const formatted = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(totalOtherTaxes);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('total'));
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
  },
];