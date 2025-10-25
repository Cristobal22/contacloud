'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { DOCUMENT_TEMPLATES } from '@/lib/document-templates';
import { contratoTrabajadorAdministrativoTemplate } from '@/templates/contrato-trabajador-administrativo';
import { cartaRenunciaVoluntariaTemplate } from '@/templates/carta-renuncia-voluntaria';
import { finiquitoContratoTrabajoTemplate } from '@/templates/finiquito-contrato-trabajo';
import { contratoPlazoFijoTemplate } from '@/templates/contrato-plazo-fijo';
import { avisoTerminoContratoTemplate } from '@/templates/aviso-termino-contrato';
import { convenioPracticaProfesionalTemplate } from '@/templates/convenio-practica-profesional';
import { contratoConstruccionTemplate } from '@/templates/contrato-construccion';
import { contratoTemporadaTemplate } from '@/templates/contrato-temporada';
import { contratoCasaParticularPuertasAdentroTemplate } from '@/templates/contrato-casa-particular-puertas-adentro';
import { contratoCasaParticularPuertasAfueraTemplate } from '@/templates/contrato-casa-particular-puertas-afuera';
import { anexoContratoTrabajoTemplate } from '@/templates/anexo-contrato-trabajo';
import { pactoHorasExtraTemplate } from '@/templates/pacto-horas-extra';
import React, { useState, useMemo, useEffect, useContext, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Printer, Edit, X, Save, Loader2, FileDown } from 'lucide-react';
import { useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, addDoc, doc, setDoc, serverTimestamp, DocumentReference } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Employee, LegalDocument } from '@/lib/types';
import { SelectedCompanyContext } from '@/app/dashboard/layout';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { saveAs } from 'file-saver';

interface FormData {
  [key: string]: string;
}

const formSections = {
  'carta-renuncia-voluntaria': [
    {
      title: 'I. Fecha y lugar',
      fields: [
        { id: 'ciudad_firma', label: 'Ciudad de Firma' },
        { id: 'dia_firma', label: 'Día de Firma' },
        { id: 'mes_firma', label: 'Mes de Firma' },
        { id: 'ano_firma', label: 'Año de Firma' },
      ],
    },
    {
      title: 'II. Detalles de la Renuncia',
      fields: [
        { id: 'cargo', label: 'Cargo actual del trabajador' },
        { id: 'fecha_ultimo_dia_dia', label: 'Día del último día de trabajo' },
        { id: 'fecha_ultimo_dia_mes', label: 'Mes del último día de trabajo' },
        { id: 'fecha_ultimo_dia_ano', label: 'Año del último día de trabajo' },
      ],
    },
  ],
  'finiquito-contrato-trabajo': [
    {
      title: 'Detalles del Finiquito',
      fields: [
        { id: 'causal_termino', label: 'Causal de Término' },
        { id: 'fecha_termino_contrato', label: 'Fecha Término de Contrato' },
        { id: 'indemnizacion_sustitutiva', label: 'Indemnización Sustitutiva' },
        { id: 'indemnizacion_anos_servicio', label: 'Indemnización Años de Servicio' },
        { id: 'feriado_legal', label: 'Feriado Legal' },
        { id: 'total_haberes', label: 'Total Haberes' },
        { id: 'descuentos_previsionales', label: 'Descuentos Previsionales' },
        { id: 'descuentos_salud', label: 'Descuentos Salud' },
        { id: 'otros_descuentos', label: 'Otros Descuentos' },
        { id: 'total_descuentos', label: 'Total Descuentos' },
        { id: 'total_a_pagar', label: 'Total a Pagar' },
      ],
    },
  ],
  'contrato-plazo-fijo': [
    {
      title: 'Datos del Contrato',
      fields: [
        { id: 'ciudad_firma', label: 'Ciudad de Firma' },
        { id: 'dia_firma', label: 'Día de Firma' },
        { id: 'mes_firma', label: 'Mes de Firma' },
        { id: 'ano_firma', label: 'Año de Firma' },
        { id: 'cargo', label: 'Cargo' },
        { id: 'lugar_prestacion_servicios', label: 'Lugar de Prestación de Servicios' },
        { id: 'jornada_trabajo_horas', label: 'Horas de Jornada' },
        { id: 'jornada_trabajo_dias_semana', label: 'Días de la Semana' },
        { id: 'horario_trabajo', label: 'Horario' },
        { id: 'descanso_colacion', label: 'Minutos de Colación' },
        { id: 'sueldo_base_monto', label: 'Sueldo Base' },
        { id: 'sueldo_base_palabras', label: 'Sueldo Base (Palabras)' },
        { id: 'gratificacion_monto', label: 'Gratificación' },
        { id: 'gratificacion_palabras', label: 'Gratificación (Palabras)' },
        { id: 'duracion_contrato', label: 'Duración del Contrato' },
        { id: 'fecha_inicio', label: 'Fecha de Inicio' },
        { id: 'fecha_ingreso', label: 'Fecha de Ingreso' },
      ]
    }
  ],
  'contrato-trabajador-administrativo': [
    {
      title: 'I. Comparecencia',
      fields: [
        { id: 'ciudad_firma', label: 'Ciudad de Firma' },
        { id: 'dia_firma', label: 'Día de Firma' },
        { id: 'mes_firma', label: 'Mes de Firma' },
        { id: 'ano_firma', label: 'Año de Firma' },
        { id: 'email_empresa', label: 'Email de la Empresa' },
      ]
    },
    {
      title: 'II. Cláusulas Contractuales',
      fields: [
        { id: 'cargo_trabajador', label: 'Cargo Específico' },
        { id: 'departamento_seccion', label: 'Departamento o Sección' },
        { id: 'direccion_lugar_trabajo', label: 'Dirección Lugar de Trabajo' },
        { id: 'comuna_lugar_trabajo', label: 'Comuna Lugar de Trabajo' },
        { id: 'funciones_principales', label: 'Funciones Principales' },
        { id: 'fecha_ingreso', label: 'Fecha de Ingreso' },
        { id: 'jornada_semanal_horas', label: 'Jornada Semanal (Horas)' },
        { id: 'jornada_dias', label: 'Días de Trabajo (ej. Lunes a Viernes)' },
        { id: 'jornada_horario', label: 'Horario (ej. 09:00 a 18:00)' },
        { id: 'descanso_minutos', label: 'Minutos de Descanso para Colación' },
        { id: 'horario_colacion', label: 'Horario Colación (ej. 13:00 a 14:00)' },
        { id: 'imputa_jornada_colacion', label: 'Colación se imputa a jornada? (SI/NO)' },
        { id: 'cargo_colacion', label: 'Colación de cargo de (TRABAJADOR/EMPLEADOR)' },
        { id: 'sueldo_mensual_monto', label: 'Sueldo Mensual (CLP)' },
        { id: 'sueldo_mensual_palabras', label: 'Sueldo Mensual (Palabras)' },
        { id: 'metodo_pago', label: 'Método de Pago' },
        { id: 'banco_trabajador', label: 'Banco del Trabajador' },
        { id: 'cuenta_bancaria_trabajador', label: 'N° de Cuenta del Trabajador' },
        { id: 'beneficio_a', label: 'Beneficio Adicional A' },
        { id: 'beneficio_b', label: 'Beneficio Adicional B' },
        { id: 'beneficio_c', label: 'Beneficio Adicional C' },
        { id: 'duracion_contrato', label: 'Duración del Contrato' },
      ]
    }
  ],
};

export default function DocumentEditorPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();
  const companyContext = useContext(SelectedCompanyContext);
  const company = companyContext?.selectedCompany;

  const docId = searchParams.get('docId');

  const documentRef = useMemo(() =>
    docId && firestore && company?.id
      ? doc(firestore, `companies/${company.id}/documents`, docId) as DocumentReference<LegalDocument>
      : null
  , [docId, firestore, company?.id]);

  const { data: loadedDocument, loading: docLoading } = useDoc<LegalDocument>(documentRef);

  const { data: employees, loading: employeesLoading } = useCollection<Employee>({
    path: company ? `companies/${company.id}/employees` : undefined,
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [savedDocId, setSavedDocId] = useState<string | null>(docId);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const templateDetails = DOCUMENT_TEMPLATES.find(t => t.slug === slug);
  
  const currentTemplate = useMemo(() => {
    switch (slug) {
        case 'contrato-trabajador-administrativo': return contratoTrabajadorAdministrativoTemplate;
        case 'carta-renuncia-voluntaria': return cartaRenunciaVoluntariaTemplate;
        case 'finiquito-contrato-trabajo': return finiquitoContratoTrabajoTemplate;
        case 'contrato-plazo-fijo': return contratoPlazoFijoTemplate;
        case 'aviso-termino-contrato': return avisoTerminoContratoTemplate;
        case 'convenio-practica-profesional': return convenioPracticaProfesionalTemplate;
        case 'contrato-construccion': return contratoConstruccionTemplate;
        case 'contrato-temporada': return contratoTemporadaTemplate;
        case 'contrato-casa-particular-puertas-adentro': return contratoCasaParticularPuertasAdentroTemplate;
        case 'contrato-casa-particular-puertas-afuera': return contratoCasaParticularPuertasAfueraTemplate;
        case 'anexo-contrato-trabajo': return anexoContratoTrabajoTemplate;
        case 'pacto-horas-extra': return pactoHorasExtraTemplate;
        default: return '';
    }
  }, [slug]);

  const currentSections = useMemo(() => (formSections as any)[slug as string] || [], [slug]);

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
    if (!loadedDocument) return;
    setFormData(loadedDocument.formData);
    setIsEditing(loadedDocument.isCustomized);
    setEditedContent(loadedDocument.htmlContent);
    if (loadedDocument.employeeId) {
      setSelectedEmployeeId(loadedDocument.employeeId);
    }
    if (docId) {
      setSavedDocId(docId);
    }
  }, [loadedDocument, docId]);

  useEffect(() => {
    if (docId) return;
    setFormData(initialFormData);
    setEditedContent('');
    setIsEditing(false);
    setSelectedEmployeeId('');
    setSavedDocId(null);
  }, [docId, initialFormData, slug]);

  useEffect(() => {
    if (docId || !company) return;

    const companyData: Partial<FormData> = {
      razon_social_empresa: company.name ?? '',
      rut_empresa: company.rut ?? '',
      representante_legal_nombre: company.legalRepresentativeName ?? '',
      representante_legal_rut: company.legalRepresentativeRut ?? '',
      direccion_empresa: company.address ?? '',
    };

    if (slug === 'contrato-casa-particular-puertas-adentro' || slug === 'contrato-casa-particular-puertas-afuera') {
      companyData.nombre_empleador = company.legalRepresentativeName ?? '';
      companyData.rut_empleador = company.legalRepresentativeRut ?? '';
      companyData.direccion_empleador = company.address ?? '';
      companyData.comuna_empleador = company.commune ?? '';
    }

    setFormData(prev => ({ ...prev, ...companyData }));

  }, [company, docId, slug]);

  useEffect(() => {
    if (docId || !employees) return;

    const employeeFieldKeys = [
      'nombre_trabajador', 'rut_trabajador', 'nacionalidad_trabajador',
      'fecha_nacimiento_trabajador', 'direccion_trabajador', 'comuna_trabajador',
      'email_trabajador', 'nombre_estudiante', 'rut_estudiante'
    ];

    if (selectedEmployeeId) {
      const employee = employees.find(e => e.id === selectedEmployeeId);
      if (employee) {
        const employeeData: Partial<FormData> = {
          nombre_trabajador: `${employee.firstName} ${employee.lastName}` ?? '',
          rut_trabajador: employee.rut ?? '',
          nacionalidad_trabajador: employee.nationality ?? '',
          fecha_nacimiento_trabajador: employee.birthDate ?? '',
          direccion_trabajador: employee.address ?? '',
          comuna_trabajador: employee.commune ?? '',
          email_trabajador: employee.email ?? '',
          nombre_estudiante: `${employee.firstName} ${employee.lastName}` ?? '',
          rut_estudiante: employee.rut ?? '',
        };
        setFormData(prev => ({ ...prev, ...employeeData }));
      }
    } else {
      const fieldsToClear: Partial<FormData> = {};
      for (const key of employeeFieldKeys) {
        fieldsToClear[key] = '';
      }
      setFormData(prev => ({ ...prev, ...fieldsToClear }));
    }
  }, [selectedEmployeeId, employees, docId]);

  const processedDocument = useMemo(() => {
    let doc = currentTemplate;
    const allData = { ...formData };

    for (const key in allData) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      doc = doc.replace(regex, allData[key] || '');
    }
    
    doc = doc.replace(/\{\{.*?\}\}/g, '');
    return doc;
  }, [formData, currentTemplate]);

  useEffect(() => {
    if (isEditing && contentRef.current) {
        contentRef.current.focus();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handlePrint = () => window.print();

  const handleDownloadDocx = async () => {
    setIsDownloadingDocx(true);
    const htmlString = isEditing ? editedContent : processedDocument;
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ htmlString }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const blob = await response.blob();
      saveAs(blob, `${templateDetails?.name || 'document'}.docx`);
      toast({ title: 'Descarga Iniciada', description: 'El documento .docx se está descargando.' });
    } catch (error) {
      console.error("Error generating docx: ", error);
      toast({ title: 'Error de Descarga', description: 'No se pudo generar el archivo .docx.', variant: 'destructive' });
    } finally {
      setIsDownloadingDocx(false);
    }
  };

  const handleEditClick = () => {
    setEditedContent(processedDocument);
    setIsEditing(true);
  };

  const handleBackToFormClick = () => {
    setIsEditing(false);
  };

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEditedContent(e.currentTarget.innerHTML);
  };
  
  const handleSave = async () => {
    if (!company || !firestore) return;

    setIsSaving(true);
    const documentData = {
      templateSlug: slug,
      formData,
      isCustomized: isEditing,
      htmlContent: isEditing ? editedContent : processedDocument,
      lastSaved: serverTimestamp(),
      employeeId: selectedEmployeeId,
    };

    try {
      const idToSave = savedDocId || docId;
      if (idToSave) {
        const docRef = doc(firestore, `companies/${company.id}/documents`, idToSave);
        await setDoc(docRef, documentData, { merge: true });
        toast({ title: 'Documento Actualizado', description: 'Los cambios han sido guardados.' });
      } else {
        const collectionRef = collection(firestore, `companies/${company.id}/documents`);
        const docRef = await addDoc(collectionRef, documentData);
        setSavedDocId(docRef.id);
        toast({ title: 'Documento Guardado', description: 'El nuevo documento ha sido creado.' });
      }
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({ title: 'Error al Guardar', description: 'No se pudieron guardar los cambios.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (docLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Cargando documento...</p>
      </div>
    );
  }

  if (!templateDetails) return <div>Plantilla no encontrada</div>;

  if (!currentTemplate && !docLoading) {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-bold">Plantilla en Desarrollo</h2>
                <p className="text-muted-foreground">La funcionalidad para "{templateDetails.name}" aún no ha sido implementada.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden print:h-auto print:overflow-visible">
      <div 
        id="document-preview-container" 
        className={`p-4 overflow-y-auto print:w-full print:p-0 print:overflow-visible ${isEditing ? 'w-full' : 'w-full md:w-2/3'}`}>
        <div className="h-full rounded-lg border bg-background p-6 shadow-sm print:shadow-none print:border-none">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <h2 className="text-xl font-bold">{isEditing ? 'Editando' : 'Vista Previa'}: {templateDetails.name}</h2>
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <Button onClick={handleBackToFormClick} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Volver al Formulario
                    </Button>
                ) : (
                    <Button onClick={handleEditClick} variant="outline" size="sm" disabled={!company}>
                        <Edit className="h-4 w-4 mr-2" />
                        Personalizar
                    </Button>
                )}
                <Button onClick={handleSave} variant="outline" size="sm" disabled={!company || isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Save className="h-4 w-4 mr-2" />}
                    {savedDocId || docId ? 'Actualizar' : 'Guardar'}
                </Button>
                 <Button onClick={handleDownloadDocx} variant="outline" size="sm" disabled={!company || isDownloadingDocx}>
                    {isDownloadingDocx ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                    Descargar .docx
                </Button>
                <Button onClick={handlePrint} variant="default" size="sm" disabled={!company}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                </Button>
            </div>
          </div>
          
          {isEditing && (
            <Alert className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Modo de Edición Libre</AlertTitle>
              <AlertDescription>
                Estás editando el documento directamente. Los cambios no se guardarán en el formulario. Para volver, haz clic en "Volver al Formulario".
              </AlertDescription>
            </Alert>
          )}

          <div 
            ref={contentRef}
            className={`prose prose-sm max-w-none ${isEditing ? 'bg-slate-50 p-4 rounded-md focus:outline-none focus:ring-2 focus:ring-ring' : ''}`}
            contentEditable={isEditing}
            onInput={isEditing ? handleContentChange : undefined}
            suppressContentEditableWarning={true}
            dangerouslySetInnerHTML={{ __html: isEditing ? editedContent : processedDocument }} 
          />
        </div>
      </div>

      {!isEditing && (
        <div className="w-full md:w-1/3 border-l bg-slate-50 p-4 overflow-y-auto print:hidden">
          <div className="h-full p-1 md:p-4">
            <h3 className="mb-4 text-lg font-semibold">Completar Datos</h3>
            
            <div className="mb-6 p-4 border rounded-md bg-white">
              <h4 className="mb-3 font-medium text-base">Cargar Datos</h4>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor='worker-select'>Seleccionar Persona</Label>
                  <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId} disabled={!company || docLoading}>
                    <SelectTrigger id='worker-select'>
                        <SelectValue placeholder="Elige una persona..." />
                    </SelectTrigger>
                    <SelectContent>
                        {employeesLoading && <SelectItem disabled value="loading">Cargando...</SelectItem>}
                        {employees && employees.map(employee => (
                            <SelectItem key={employee.id} value={employee.id}>{`${employee.firstName} ${employee.lastName}`}</SelectItem>
                        ))}
                        {((!employees || employees.length === 0) && !employeesLoading) && <SelectItem disabled value="no-workers">No hay personas en esta empresa.</SelectItem>}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground mt-2'>Los datos de la empresa y la persona se cargarán automáticamente.</p>
              </div>
            </div>

            {currentSections.map((section: any) => (
              <div key={section.title} className="mb-6">
                <h4 className="mb-3 font-medium text-base">{section.title}</h4>
                <div className="grid gap-4">
                  {section.fields.map((field: any) => (
                    <div key={field.id} className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input id={field.id} value={formData[field.id] || ''} onChange={handleInputChange} placeholder={field.label} disabled={!company || docLoading} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
