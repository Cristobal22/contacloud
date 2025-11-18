import { db } from '../src/firebase/server';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import * as readline from 'readline';

const BATCH_SIZE = 500;

// Helper para crear una interfaz de pregunta/respuesta en la consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askConfirmation = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
};

const deleteAllVouchers = async (companyId: string) => {
    if (!companyId) {
        console.error("ERROR: Company ID es requerido. Operación terminada.");
        process.exit(1);
    }

    if (!db) {
        console.error("[FATAL ERROR] La conexión a la base de datos de Firestore no está disponible.");
        process.exit(1);
    }

    console.log(`[DANGER] Este script borrará permanentemente TODOS los vouchers de la empresa con ID: ${companyId}`);
    
    const confirmation = await askConfirmation(`\n> Para confirmar esta acción, por favor escribe el ID de la empresa nuevamente: `);

    if (confirmation !== companyId) {
        console.log("\nLa confirmación no coincide. Operación cancelada de forma segura.");
        rl.close();
        process.exit(0);
    }

    console.log("\nConfirmación aceptada. Iniciando proceso de borrado...");

    const vouchersRef = db.collection(`companies/${companyId}/vouchers`);

    try {
        let deletedCount = 0;
        let snapshot;

        do {
            snapshot = await vouchersRef.limit(BATCH_SIZE).get();
            if (snapshot.empty) {
                break;
            }

            const batch = db.batch();
            snapshot.docs.forEach((doc: QueryDocumentSnapshot) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            deletedCount += snapshot.size;
            console.log(`...se ha borrado un lote de ${snapshot.size} vouchers.`);

        } while (snapshot.size > 0);

        if (deletedCount === 0) {
            console.log(`[SUCCESS] No se encontraron vouchers para la empresa ${companyId}. No se borró nada.`);
        } else {
            console.log(`[SUCCESS] Proceso finalizado. Se han borrado un total de ${deletedCount} vouchers para la empresa ${companyId}.`);
        }

    } catch (error: any) {
        console.error("[FATAL ERROR] Ocurrió un error durante el proceso de borrado:", error);
        process.exit(1);
    } finally {
        rl.close();
        process.exit(0);
    }
};

const companyId = process.argv[2];
deleteAllVouchers(companyId);
