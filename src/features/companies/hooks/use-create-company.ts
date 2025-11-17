import { getFunctions, httpsCallable, HttpsCallableResult } from "firebase/functions";
import { useToast } from "@/hooks/use-toast";

// 1. Define la estructura de los datos que se envían a la función.
interface NewCompanyPayload {
  name: string;
  rut: string;
  // Añade aquí otros campos si los has incluido en tu formulario.
}

// 2. Define la estructura de la respuesta exitosa de la función.
interface CreateCompanySuccessResponse {
  status: "success";
  companyId: string;
}

/**
 * Hook para invocar la Callable Cloud Function `createCompanyAndAssociateUser`.
 * Proporciona un método para crear una nueva empresa de forma segura,
 * manejando el feedback al usuario (success, error) usando el sistema de Toast de la app.
 */
export const useCreateCompany = () => {
  const { toast } = useToast();

  const callCreateCompany = async (companyData: NewCompanyPayload): Promise<HttpsCallableResult<CreateCompanySuccessResponse> | null> => {
    // Validaciones básicas en el cliente
    if (!companyData.name.trim() || !companyData.rut.trim()) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "El nombre y el RUT de la empresa son obligatorios.",
      });
      return null;
    }

    const functions = getFunctions();
    const createCompanyFn = httpsCallable<NewCompanyPayload, CreateCompanySuccessResponse>(
      functions,
      "createCompanyAndAssociateUser"
    );

    try {
      const result = await createCompanyFn(companyData);
      toast({
        title: "Empresa Creada",
        description: `La empresa "${companyData.name}" ha sido creada con éxito.`,
      });
      console.log("Empresa creada con ID:", result.data.companyId);

      return result;
    } catch (error: any) {
      console.error("Error al invocar la Cloud Function:", error);
      
      let errorMessage = "Ocurrió un error inesperado al crear la empresa.";
      if (error.code === "functions/unauthenticated") {
        errorMessage = "Debes iniciar sesión para poder crear una empresa.";
      } else if (error.code === "functions/invalid-argument") {
        errorMessage = "Los datos enviados no son válidos. Revisa el formulario.";
      } else if (error.details && typeof error.details === 'string') {
        errorMessage = error.details;
      }
      
      toast({
        variant: "destructive",
        title: "Error al crear la empresa",
        description: errorMessage,
      });
      return null;
    }
  };

  return { callCreateCompany };
};

/*
--- Ejemplo de uso en un componente de React con react-hook-form ---

import { useForm } from 'react-hook-form';
import { useCreateCompany } from '@/features/companies/hooks/use-create-company';

const CompanyForm = () => {
  const { register, handleSubmit } = useForm();
  const { callCreateCompany } = useCreateCompany();

  const onSubmit = (data) => {
    // Los datos del formulario (`data`) deben coincidir con NewCompanyPayload
    callCreateCompany({ name: data.companyName, rut: data.companyRut });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("companyName")} placeholder="Nombre de la Empresa" />
      <input {...register("companyRut")} placeholder="RUT de la Empresa" />
      <button type="submit">Crear Empresa</button>
    </form>
  );
};
*/
