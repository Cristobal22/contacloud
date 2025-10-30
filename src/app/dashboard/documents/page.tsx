'use client';

import { DOCUMENT_TEMPLATES } from '@/lib/document-templates';
import { useUserProfile } from '@/firebase/auth/use-user-profile';
import { useUser } from '@/firebase';
import Link from 'next/link';
import { plans } from '@/lib/plans';
import { Button } from '@/components/ui/button';

export default function DocumentsPage() {
  const { user } = useUser();
  const { userProfile, loading: profileLoading } = useUserProfile(user?.uid);

  if (profileLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Cargando y verificando tu plan...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">No se pudo verificar tu perfil</h2>
            <p className="text-muted-foreground">
                No pudimos cargar la información de tu cuenta. Por favor, intenta recargar la página o vuelve a iniciar sesión.
            </p>
        </div>
    );
  }

  const userPlan = plans.find(plan => 
    plan.id.toLowerCase() === (userProfile.plan?.toLowerCase() ?? '')
  );
  const hasAccess = userProfile.role === 'Admin' || (userPlan?.hasDocumentsModule ?? false);

  if (!hasAccess) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold">Acceso Restringido</h2>
            <p className="text-muted-foreground">
                La sección de Documentos Legales no está incluida en tu plan actual.
            </p>
            <p>
                Para generar contratos, finiquitos y otros documentos, por favor, mejora tu plan.
            </p>
            <Link href="/dashboard/billing">
                <Button>Ver Planes y Precios</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Selecciona una Plantilla de Documento</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {DOCUMENT_TEMPLATES.map(template => (
          <Link key={template.slug} href={`/dashboard/documents/${template.slug}`}>
            <div className="block h-full cursor-pointer rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:scale-105 hover:shadow-md">
              <h2 className="mb-2 text-lg font-semibold">{template.name}</h2>
              <p className="text-sm text-muted-foreground">Tipo: {template.type}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}