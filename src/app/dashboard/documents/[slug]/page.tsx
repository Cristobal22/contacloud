
'use client';

import { useParams } from 'next/navigation';
import { DOCUMENT_TEMPLATES } from '@/lib/document-templates';
import { contratoTrabajadorAdministrativoTemplate } from '@/templates/contrato-trabajador-administrativo';
import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useCollection, useDoc } from '@/firebase';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { doc, getFirestore } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Company, Employee } from '@/lib/types';

interface FormData {
  [key: string]: string;
}

const formSections = {
  'contrato-trabajador-administrativo': [
    {
      title: 'Datos Generales del Contrato',
      fields: [
        { id: 'ciudad', label: 'Ciudad del Contrato' },
        { id: 'dia', label: 'Día' },
        { id: 'mes', label: 'Mes' },
        { id: 'año', label: 'Año' },
        { id: 'fecha_inicio_contrato_dia', label: 'Día de Ingreso' },
        { id: 'fecha_inicio_contrato_mes', label: 'Mes de Ingreso' },
        { id: 'fecha_inicio_contrato_año', label: 'Año de Ingreso' },
        { id: 'duracion_contrato', label: 'Duración del Contrato (Ej: Indefinido, A Plazo Fijo)' },
        { id: 'ciudad_domicilio_legal', label: 'Ciudad para Domicilio Legal' },
      ],
    },
    {
      title: 'Datos de la Empresa',
      fields: [
        { id: 'razon_social_empresa', label: 'Razón Social' },
        { id: 'rut_empresa', label: 'RUT de la Empresa' },
        { id: 'representante_legal_nombre', label: 'Nombre Representante Legal' },
        { id: 'representante_legal_rut', label: 'RUT Representante Legal' },
        { id: 'direccion_empresa', label: 'Dirección' },
        { id: 'numero_direccion_empresa', label: 'Número' },
        { id: 'comuna_empresa', label: 'Comuna' },
        { id: 'region_empresa', label: 'Región' },
        { id: 'email_empresa', label: 'Email de la Empresa' },
      ],
    },
    {
        title: 'Datos del Trabajador',
        fields: [
            { id: 'nombre_trabajador', label: 'Nombre del Trabajador' },
            { id: 'rut_trabajador', label: 'RUT del Trabajador' },
            { id: 'fecha_nacimiento_trabajador', label: 'Fecha de Nacimiento' },
            { id: 'nacionalidad_trabajador', label: 'Nacionalidad' },
            { id: 'direccion_trabajador', label: 'Dirección' },
            { id: 'numero_direccion_trabajador', label: 'Número' },
            { id: 'comuna_trabajador', label: 'Comuna' },
            { id: 'region_trabajador', label: 'Región' },
            { id: 'pais_origen_trabajador', label: 'País de Origen' },
            { id: 'email_trabajador', label: 'Email del Trabajador' },
        ],
    },
    {
        title: 'Condiciones Laborales',
        fields: [
            { id: 'cargo', label: 'Cargo' },
            { id: 'departamento', label: 'Departamento / Sección' },
            { id: 'lugar_de_trabajo', label: 'Lugar de Trabajo (Dirección)' },
            { id: 'comuna_lugar_de_trabajo', label: 'Comuna Lugar de Trabajo' },
            { id: 'jornada_semanal_horas', label: 'Horas Jornada Semanal' },
            { id: 'dias_de_trabajo', label: 'Días de Trabajo (Ej: Viernes)' },
            { id: 'horario_entrada', label: 'Horario de Entrada' },
            { id: 'horario_salida', label: 'Horario de Salida' },
            { id: 'tiempo_colacion_minutos', label: 'Minutos de Colación' },
            { id: 'horario_inicio_colacion', label: 'Inicio Colación' },
            { id: 'horario_fin_colacion', label: 'Fin Colación' },
            { id: 'costo_colacion', label: 'Quién asume el costo de la colación (Empleador/Trabajador)' },
            { id: 'sueldo_base_pesos', label: 'Sueldo Base ($)' },
            { id: 'sueldo_base_letras', label: 'Sueldo Base (en letras)' },
        ],
    },
    {
        title: 'Beneficios Adicionales',
        fields: [
            { id: 'beneficio_a', label: 'Beneficio A' },
            { id: 'beneficio_b', label: 'Beneficio B' },
            { id: 'beneficio_c', label: 'Beneficio C' },
        ],
    },
  ],
};

export default function DocumentEditorPage() {
  const { slug } = useParams();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = getFirestore();

  const companyId = useMemo(() => userProfile?.companyIds?.[0], [userProfile]);

  const companyRef = useMemo(() => companyId ? doc(firestore, 'companies', companyId) : null, [firestore, companyId]);
  const { data: company } = useDoc<Company>(companyRef);

  const { data: employees, loading: employeesLoading } = useCollection<Employee>({
    path: companyId ? `companies/${companyId}/employees` : undefined,
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const templateDetails = DOCUMENT_TEMPLATES.find(t => t.slug === slug);
  const currentTemplate = slug === 'contrato-trabajador-administrativo' ? contratoTrabajadorAdministrativoTemplate : '';
  const currentSections = (formSections as any)[slug as string] || [];

  const initialFormData = useMemo(() => {
    const data: FormData = {};
    currentSections.forEach((section: any) => {
      section.fields.forEach((field: any) => {
        data[field.id] = '';
      });
    });
    return data;
  }, [currentSections]);

  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    const dataToSet: Partial<FormData> = {};
    if (company) {
        dataToSet.razon_social_empresa = company.name ?? '';
        dataToSet.rut_empresa = company.rut ?? '';
        dataToSet.representante_legal_nombre = company.legalRepresentativeName ?? '';
        dataToSet.representante_legal_rut = company.legalRepresentativeRut ?? '';
        dataToSet.direccion_empresa = company.address ?? '';
        dataToSet.numero_direccion_empresa = company.addressNumber ?? '';
        dataToSet.comuna_empresa = company.commune ?? '';
        dataToSet.region_empresa = company.region ?? '';
        dataToSet.email_empresa = company.email ?? '';
    }

    if (selectedEmployeeId && employees) {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      if (employee) {
        dataToSet.nombre_trabajador = `${employee.firstName} ${employee.lastName}` ?? '';
        dataToSet.rut_trabajador = employee.rut ?? '';
        dataToSet.fecha_nacimiento_trabajador = employee.birthDate ?? '';
        dataToSet.nacionalidad_trabajador = employee.nationality ?? '';
        dataToSet.direccion_trabajador = employee.address ?? '';
        dataToSet.numero_direccion_trabajador = ''; // This field does not exist in the Employee model
        dataToSet.comuna_trabajador = employee.commune ?? '';
        dataToSet.region_trabajador = employee.region ?? '';
        dataToSet.pais_origen_trabajador = employee.nationality ?? ''; // Mapped from nationality
        dataToSet.email_trabajador = employee.email ?? '';
      }
    }
    setFormData(prev => ({ ...prev, ...dataToSet }));
  }, [company, selectedEmployeeId, employees]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const processedDocument = useMemo(() => {
    let doc = currentTemplate;
    for (const key in formData) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      doc = doc.replace(regex, formData[key] || `{{${key}}}`);
    }
    return doc;
  }, [formData, currentTemplate]);

  if (!templateDetails) {
    return <div>Plantilla no encontrada</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col md:flex-row overflow-hidden">
      <div className="w-full md:w-2/3 p-4 overflow-y-auto">
        <div className="h-full rounded-lg border bg-background p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Vista Previa: {templateDetails.name}</h2>
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: processedDocument }} />
        </div>
      </div>

      <div className="w-full md:w-1/3 border-l bg-slate-50 p-4 overflow-y-auto">
        <div className="h-full p-1 md:p-4">
          <h3 className="mb-4 text-lg font-semibold">Completar Datos</h3>
          
          <div className="mb-6 p-4 border rounded-md bg-white">
            <h4 className="mb-3 font-medium text-base">Cargar Datos</h4>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor='worker-select'>Seleccionar Trabajador</Label>
                <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId}>
                  <SelectTrigger id='worker-select'>
                      <SelectValue placeholder="Elige un trabajador..." />
                  </SelectTrigger>
                  <SelectContent>
                      {employeesLoading && <SelectItem disabled value="loading">Cargando trabajadores...</SelectItem>}
                      {employees && employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>{`${employee.firstName} ${employee.lastName}`}</SelectItem>
                      ))}
                      {((!employees || employees.length === 0) && !employeesLoading) && <SelectItem disabled value="no-workers">No hay trabajadores en esta empresa.</SelectItem>}
                  </SelectContent>
                </Select>
                <p className='text-xs text-muted-foreground mt-2'>Al seleccionar un trabajador, sus datos y los de la empresa se cargarán automáticamente en el formulario.</p>
            </div>
          </div>

          {currentSections.map((section: any) => (
            <div key={section.title} className="mb-6">
              <h4 className="mb-3 font-medium text-base">{section.title}</h4>
              <div className="grid gap-4">
                {section.fields.map((field: any) => (
                  <div key={field.id} className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    <Input id={field.id} value={formData[field.id]} onChange={handleInputChange} placeholder={field.label} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
