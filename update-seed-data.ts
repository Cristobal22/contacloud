
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { initialAfpEntities, initialHealthEntities, initialFamilyAllowanceParameters, initialTaxParameters, initialEconomicIndicators, initialInstitutions } from './src/lib/seed-data.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Check for service account credentials
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Error: La variable de entorno GOOGLE_APPLICATION_CREDENTIALS no está configurada.');
    console.error('Asegúrate de que apunte a la ruta de tu archivo de clave de servicio de Firebase.');
    process.exit(1);
}

try {
    initializeApp({
        credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS as string),
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
} catch (error: any) {
    if (error.code === 'app/duplicate-app') {
        console.log('La aplicación de Firebase Admin ya estaba inicializada.');
    } else {
        console.error('Error al inicializar Firebase Admin SDK:', error);
        process.exit(1);
    }
}


const db = getFirestore();

async function clearCollection(collectionPath: string) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`Colección ${collectionPath} ya está vacía.`);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Colección ${collectionPath} limpiada.`);
}

async function seedCollection(collectionPath: string, data: any[]) {
    if (data.length === 0) {
        console.log(`No hay datos para poblar la colección ${collectionPath}.`);
        return;
    }

    const collectionRef = db.collection(collectionPath);
    const batch = db.batch();
    
    data.forEach(item => {
        // Let Firestore generate a unique ID for each parameter entry.
        const docRef = collectionRef.doc();
        batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`Colección ${collectionPath} poblada con ${data.length} documentos.`);
}

async function seedEconomicIndicators(collectionPath: string, data: any[]) {
    if (data.length === 0) {
        console.log(`No hay datos para poblar la colección ${collectionPath}.`);
        return;
    }
    const collectionRef = db.collection(collectionPath);
    const batch = db.batch();
    data.forEach(item => {
        // For economic indicators, the ID is 'YYYY-MM'
        const docId = `${item.year}-${String(item.month).padStart(2, '0')}`;
        const docRef = collectionRef.doc(docId);
        batch.set(docRef, item);
    });
    await batch.commit();
    console.log(`Colección ${collectionPath} poblada con ${data.length} documentos.`);
}

async function main() {
    try {
        console.log('--- Iniciando proceso de actualización de parámetros ---');
        
        await clearCollection('afp-entities');
        await seedCollection('afp-entities', initialAfpEntities);
        
        await clearCollection('health-entities');
        await seedCollection('health-entities', initialHealthEntities);

        await clearCollection('family-allowance-parameters');
        await seedCollection('family-allowance-parameters', initialFamilyAllowanceParameters);

        await clearCollection('tax-parameters');
        await seedCollection('tax-parameters', initialTaxParameters);
        
        await clearCollection('economic-indicators');
        await seedEconomicIndicators('economic-indicators', initialEconomicIndicators);

        await clearCollection('institutions');
        await seedCollection('institutions', initialInstitutions);

        console.log('--- Proceso de actualización de parámetros completado exitosamente ---');
    } catch (error) {
        console.error('Ocurrió un error durante la actualización:', error);
        process.exit(1);
    }
}

main();
