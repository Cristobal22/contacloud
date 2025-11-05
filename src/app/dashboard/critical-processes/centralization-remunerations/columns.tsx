'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Payroll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

declare module '@tanstack/react-table' {
  interface TableMeta {
    deletePayroll: (payrollId: string) => void;
  }
}

export const columns: ColumnDef<Payroll>[] = [
  {
    accessorKey: 'employeeName',
    header: 'Empleado',
  },
  {
    accessorKey: 'baseSalary',
    header: 'Sueldo Base',
    cell: ({ row }) => `$${row.original.baseSalary.toLocaleString('es-CL')}`,
  },
  {
    accessorKey: 'totalEarnings',
    header: 'Total Haberes',
    cell: ({ row }) => `$${row.original.totalEarnings.toLocaleString('es-CL')}`,
  },
  {
    accessorKey: 'totalDiscounts',
    header: 'Total Descuentos',
    cell: ({ row }) => `$${row.original.totalDiscounts.toLocaleString('es-CL')}`,
  },
  {
    accessorKey: 'netSalary',
    header: 'Sueldo Líquido',
    cell: ({ row }) => `$${row.original.netSalary.toLocaleString('es-CL')}`,
  },
  {
    id: 'actions',
    header: "Acciones",
    cell: ({ row, table }) => {
      const payroll = row.original;
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => table.options.meta?.deletePayroll(payroll.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      );
    },
  },
];
