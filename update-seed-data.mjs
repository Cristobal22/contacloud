// @ts-check
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { 
    initialAfpEntities, 
    initialEconomicIndicators, 
    initialFamilyAllowanceParameters, 
    initialHealthEntities, 
    initialTaxParameters 
} from './src/lib/seed-data.js';

// --- Configuración de Conexión ---
// Carga las credenciales de la cuenta de servicio desde las variables de entorno.
// Asegúrate de tener tu GOOGLE_APPLICATION_CREDENTIALS configurado en tu entorno de desarrollo.
// Puedes obtener este archivo JSON desde la configuración de tu proyecto en Firebase > Cuentas de servicio.
const serviceAccountKey = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountKey) {
    console.error('Error: La variable de entorno GOOGLE_APPLICATION_CREDENTIALS no está configurada.');
    console.error('Por favor, descarga la clave de la cuenta de servicio de Firebase y configura la variable.');
    process.exit(1);
}

try {
    initializeApp({
        credential: cert(JSON.parse(serviceAccountKey))
    });
} catch(e) {
    // Esto puede pasar si ya está inicializado en otro lugar.
}


const db = getFirestore();

/**
 * Borra todos los documentos de una colección.
 * @param {string} collectionPath - La ruta de la colección a limpiar.
 */
async function clearCollection(collectionPath) {
    console.log(`Limpiando la colección: ${collectionPath}...`);
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`La colección ${collectionPath} ya está vacía.`);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Se eliminaron ${snapshot.size} documentos de ${collectionPath}.`);
}

/**
 * Puebla una colección con datos iniciales.
 * @param {string} collectionPath - La ruta de la colección.
 * @param {Array<Object>} data - Los datos a agregar.
 * @param {(item: Object) => string} [docIdGenerator] - Función opcional para generar el ID del documento.
 */
async function seedCollection(collectionPath, data, docIdGenerator) {
    console.log(`Poblando la colección: ${collectionPath}...`);
    const collectionRef = db.collection(collectionPath);
    const batch = db.batch();

    data.forEach(item => {
        const id = docIdGenerator ? docIdGenerator(item) : item.code || `${item.year}-${String(item.month).padStart(2, '0')}`;
        if (!id) {
            console.warn(`Saltando item sin ID en ${collectionPath}:`, item);
            return;
        }
        const docRef = collectionRef.doc(id);
        batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`Se agregaron ${data.length} documentos a ${collectionPath}.`);
}

/**
 * Función principal que ejecuta la actualización de todos los datos maestros.
 */
async function updateAllSeedData() {
    console.log('--- Iniciando actualización de datos maestros ---');
    try {
        await clearCollection('tax-parameters');
        await seedCollection('tax-parameters', initialTaxParameters, (item) => `${item.year}-${String(item.month).padStart(2, '0')}-${item.desde}`);

        await clearCollection('family-allowance-parameters');
        await seedCollection('family-allowance-parameters', initialFamilyAllowanceParameters, (item) => item.tramo);

        await clearCollection('afp-entities');
        await seedCollection('afp-entities', initialAfpEntities, (item) => item.code);
        
        await clearCollection('health-entities');
        await seedCollection('health-entities', initialHealthEntities, (item) => item.code);

        await clearCollection('economic-indicators');
        await seedCollection('economic-indicators', initialEconomicIndicators, (item) => `${item.year}-${String(item.month).padStart(2, '0')}`);

        console.log('--- ✅ Actualización de datos maestros completada exitosamente ---');
    } catch (error) {
        console.error('--- ❌ Error durante la actualización de datos maestros ---');
        console.error(error);
        process.exit(1);
    }
}

updateAllSeedData();
