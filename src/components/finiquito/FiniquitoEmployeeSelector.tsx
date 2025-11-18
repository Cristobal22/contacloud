'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import type { Employee } from '@/lib/types';
import { cn } from '@/lib/utils';

interface FiniquitoEmployeeSelectorProps {
    employees: Employee[] | undefined;
    loading: boolean;
    selectedEmployeeId: string | null;
    onSelectEmployee: (id: string | null) => void;
}

export function FiniquitoEmployeeSelector({ employees, loading, selectedEmployeeId, onSelectEmployee }: FiniquitoEmployeeSelectorProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const selectedEmployee = employees?.find(e => e.id === selectedEmployeeId);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="employee-selector">Seleccionar Persona</label>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="employee-selector"
                        variant="outline"
                        role="combobox"
                        aria-expanded={isOpen}
                        className="w-full justify-between font-normal"
                    >
                        {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.rut})` : "Seleccionar empleado..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar empleado..." />
                        <CommandList>
                            <CommandEmpty>No se encontraron empleados.</CommandEmpty>
                            <CommandGroup>
                                {loading && <CommandItem>Cargando...</CommandItem>}
                                {employees?.map(employee => (
                                    <CommandItem
                                        key={employee.id}
                                        value={`${employee.firstName} ${employee.lastName} ${employee.rut}`}
                                        onSelect={() => {
                                            onSelectEmployee(employee.id!);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", selectedEmployeeId === employee.id ? "opacity-100" : "opacity-0")} />
                                        {employee.firstName} {employee.lastName} <span className='text-muted-foreground ml-2'>{employee.rut}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
