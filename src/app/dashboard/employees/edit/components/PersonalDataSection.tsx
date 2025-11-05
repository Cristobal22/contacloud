'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Employee } from '@/lib/types';
import { nationalities, regions } from '@/lib/geographical-data';

interface PersonalDataSectionProps {
    employee: Partial<Employee>;
    handleFieldChange: (field: keyof Employee, value: any) => void;
    availableCommunes: string[];
}

export function PersonalDataSection({ employee, handleFieldChange, availableCommunes }: PersonalDataSectionProps) {
    return (
        <section id="personal-data" className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">1. Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>RUT</Label>
                    <Input
                        value={employee.rut}
                        onChange={e => handleFieldChange('rut', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Nombres</Label>
                    <Input
                        value={employee.firstName}
                        onChange={e => handleFieldChange('firstName', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Apellidos</Label>
                    <Input
                        value={employee.lastName}
                        onChange={e => handleFieldChange('lastName', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input
                        type="date"
                        value={employee.birthDate}
                        onChange={e => handleFieldChange('birthDate', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Nacionalidad</Label>
                    <Select
                        value={employee.nationality}
                        onValueChange={v => handleFieldChange('nationality', v)}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>{nationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                        value={employee.address}
                        onChange={e => handleFieldChange('address', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Región</Label>
                    <Select
                        value={employee.region}
                        onValueChange={v => handleFieldChange('region', v)}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Comuna</Label>
                    <Select
                        value={employee.commune}
                        onValueChange={v => handleFieldChange('commune', v)}
                        disabled={!employee.region}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>{availableCommunes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                        value={employee.phone}
                        onChange={e => handleFieldChange('phone', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={employee.email}
                        onChange={e => handleFieldChange('email', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Género</Label>
                    <Select
                        value={employee.gender}
                        onValueChange={v => handleFieldChange('gender', v)}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Estado Civil</Label>
                    <Select
                        value={employee.maritalStatus}
                        onValueChange={v => handleFieldChange('maritalStatus', v)}
                    >
                        <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Soltero(a)">Soltero(a)</SelectItem>
                            <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                            <SelectItem value="Viudo(a)">Viudo(a)</SelectItem>
                            <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Nombre Contacto Emergencia</Label>
                    <Input
                        value={employee.emergencyContactName}
                        onChange={e => handleFieldChange('emergencyContactName', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Teléfono Contacto Emergencia</Label>
                    <Input
                        value={employee.emergencyContactPhone}
                        onChange={e => handleFieldChange('emergencyContactPhone', e.target.value)}
                    />
                </div>
            </div>
        </section>
    );
}