'use server';

import { revalidatePath } from 'next/cache';
import { adminFirestore } from '@/firebase/admin';

// Interface para el resultado de las acciones
interface ActionResult {
    success: boolean;
    message: string;
}

// Interface para el resultado de la verificación de historial
export interface HistoryCheckResult {
    hasHistory: boolean;
    error?: string;
}

/**
 * Verifica si un empleado tiene datos históricos (p. ej., documentos legales).
 * @param companyId - El ID de la empresa.
 * @param employeeId - El ID del empleado.
 * @returns Un objeto indicando si se encontró historial.
 */
export async function checkEmployeeHistory(companyId: string, employeeId: string): Promise<HistoryCheckResult> {
    if (!companyId || !employeeId) {
        return { hasHistory: false, error: 'Faltan los identificadores necesarios.' };
    }

    try {
        // Verificar si existen documentos legales asociados al empleado
        const documentsQuery = adminFirestore
            .collection('companies').doc(companyId)
            .collection('documents')
            .where('employeeId', '==', employeeId)
            .limit(1);

        const documentsSnapshot = await documentsQuery.get();
        if (!documentsSnapshot.empty) {
            // Si se encuentra al menos un documento, el empleado tiene historial.
            return { hasHistory: true };
        }

        // Podríamos añadir más verificaciones aquí en el futuro (p. ej., liquidaciones).

        return { hasHistory: false }; // No se encontró historial.
    } catch (error) {
        console.error('Error al verificar el historial del empleado:', error);
        return { hasHistory: false, error: 'Ocurrió un error al verificar el historial del empleado.' };
    }
}

/**
 * Desactiva un empleado (soft delete).
 * @param companyId - El ID de la empresa.
 * @param employeeId - El ID del empleado a desactivar.
 * @returns El resultado de la operación.
 */
export async function softDeleteEmployee(companyId: string, employeeId: string): Promise<ActionResult> {
    if (!companyId || !employeeId) {
        return { success: false, message: 'Faltan los identificadores necesarios.' };
    }

    try {
        const employeeRef = adminFirestore.collection('companies').doc(companyId).collection('employees').doc(employeeId);
        await employeeRef.update({ status: 'Inactive' });

        revalidatePath('/dashboard/employees');
        return { success: true, message: 'El empleado ha sido desactivado correctamente.' };
    } catch (error) {
        console.error('Error al desactivar al empleado:', error);
        return { success: false, message: 'Ocurrió un error al intentar desactivar al empleado.' };
    }
}

/**
 * Elimina permanentemente a un empleado, solo si no tiene historial.
 * @param companyId - El ID de la empresa.
 * @param employeeId - El ID del empleado a eliminar.
 * @returns El resultado de la operación.
 */
export async function permanentlyDeleteEmployee(companyId: string, employeeId: string): Promise<ActionResult> {
    if (!companyId || !employeeId) {
        return { success: false, message: 'Faltan los identificadores necesarios.' };
    }

    try {
        // La verificación de seguridad sobre el historial se realiza ahora en el lado del cliente
        // antes de llamar a esta función.
        const employeeRef = adminFirestore.collection('companies').doc(companyId).collection('employees').doc(employeeId);
        await employeeRef.delete();

        revalidatePath('/dashboard/employees');
        return { success: true, message: 'El empleado ha sido eliminado permanentemente.' };
    } catch (error) {
        console.error('Error al eliminar permanentemente al empleado:', error);
        return { success: false, message: 'Ocurrió un error al intentar eliminar al empleado.' };
    }
}
