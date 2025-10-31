
'use server';

import { revalidatePath } from 'next/cache';
import { getAdminApp } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function deleteEmployee(companyId: string, employeeId: string): Promise<{ success: boolean; message: string }> {
    if (!companyId || !employeeId) {
        return { success: false, message: 'ID de compañía y empleado son requeridos.' };
    }

    try {
        const adminApp = await getAdminApp();
        const firestore = getFirestore(adminApp);
        const auth = getAuth(adminApp);

        const employeeRef = firestore.collection('companies').doc(companyId).collection('employees').doc(employeeId);
        const employeeDoc = await employeeRef.get();

        if (!employeeDoc.exists) {
            return { success: false, message: 'El empleado no fue encontrado.' };
        }

        const employeeData = employeeDoc.data();
        const employeeEmail = employeeData?.email;

        // 1. Delete user from Firebase Authentication if email exists
        if (employeeEmail) {
            try {
                const userRecord = await auth.getUserByEmail(employeeEmail);
                await auth.deleteUser(userRecord.uid);
            } catch (error: any) {
                // If the user does not exist in Auth, it's not a fatal error.
                // We can proceed with deleting the Firestore document.
                if (error.code !== 'auth/user-not-found') {
                    throw error; // Re-throw other auth errors
                }
                console.log(`No se encontró un usuario de autenticación para el email ${employeeEmail}. Se omitió la eliminación de Auth.`);
            }
        }

        // 2. Delete employee document from Firestore
        await employeeRef.delete();
        
        // 3. Revalidate the employees list page to reflect the changes
        revalidatePath('/dashboard/employees');

        return { success: true, message: 'Empleado eliminado exitosamente.' };

    } catch (error) {
        console.error("Error al eliminar empleado:", error);
        // This generic message is safer for the client-side.
        // Specific errors are logged on the server.
        return { success: false, message: 'Ocurrió un error al eliminar el empleado.' };
    }
}
