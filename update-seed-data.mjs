
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';

// --- IMPORT SEED DATA ---
// We are importing directly from the TypeScript source files.
// Node's ES module support handles this correctly.
import {
    initialAfpEntities
} from './dist/lib/seed-data.js';

// Since we cannot directly import TS files with data in a .mjs file,
// we will read and parse them as JSON-like structures. This is a workaround.
function loadJsonFromTs(filePath) {
    let fileContent = readFileSync(filePath, 'utf8');
    // Remove export const ... = and the trailing semicolon
    fileContent = fileContent.replace(/export\s+const\s+\w+\s*:\s*any\[\]\s*=\s*/, '');
    fileContent = fileContent.replace(/;/g, '');
    // A bit risky, but works for our simple object array structure.
    return eval(fileContent);
}

const initialHealthEntities = loadJsonFromTs('./src/lib/seed-data.ts');

const collectionsToUpdate = [
    { name: 'afp-entities', data: initialAfpEntities },
    { name: 'health-entities', data: loadJsonFromTs('./src/lib/seed-data.ts').initialHealthEntities },
    { name: 'family-allowance-parameters', data: loadJsonFromTs('./src/lib/seed-data.ts').initialFamilyAllowanceParameters },
    { name: 'tax-parameters', data: loadJsonFromTs('./src/lib/seed-data.ts').initialTaxParameters },
    { name: 'institutions', data: loadJsonFromTs('./src/lib/seed-data.ts').initialInstitutions },
    { name: 'economic-indicators', data: loadJsonFromTs('./src/lib/seed-data.ts').initialEconomicIndicators.map(item => ({ ...item, id: `${item.year}-${String(item.month).padStart(2, '0')}` })) },
];


// --- FIREBASE ADMIN INITIALIZATION ---
// This uses the Admin SDK, which bypasses all security rules.
// It requires a service account file to be present in the root directory.
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', 'Error: service-account.json no encontrado.');
  console.error('Por favor, descarga el archivo de credenciales de tu proyecto de Firebase y guárdalo como "service-account.json" en la raíz del proyecto.');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// --- HELPER FUNCTIONS ---
async function clearCollection(collectionPath) {
  const collectionRef = db.collection(collectionPath);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Colección "${collectionPath}" ya está vacía.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`\x1b[32mColección "${collectionPath}" limpiada (${snapshot.size} documentos eliminados).\x1b[0m`);
}

async function populateCollection(collectionPath, data) {
    if (!data || data.length === 0) {
        console.log(`No hay datos para popular la colección "${collectionPath}".`);
        return;
    }
  const collectionRef = db.collection(collectionPath);
  const batch = db.batch();
  
  data.forEach(item => {
    const { id, ...rest } = item;
    const docRef = id ? collectionRef.doc(id) : collectionRef.doc();
    batch.set(docRef, rest);
  });

  await batch.commit();
  console.log(`\x1b[32mColección "${collectionPath}" populada con ${data.length} documentos.\x1b[0m`);
}


// --- MAIN EXECUTION ---
async function main() {
    console.log('\x1b[33m%s\x1b[0m', 'Este script actualizará los parámetros globales de la aplicación.');
    console.log('Se borrarán los datos existentes en las siguientes colecciones y se reemplazarán con los datos del sistema:');
    collectionsToUpdate.forEach(c => console.log(`- ${c.name}`));
    
    rl.question('\n\x1b[33m¿Estás seguro de que deseas continuar? (s/n): \x1b[0m', async (answer) => {
        if (answer.toLowerCase() === 's') {
            console.log('\nIniciando actualización...');
            try {
                for (const collection of collectionsToUpdate) {
                    await clearCollection(collection.name);
                    await populateCollection(collection.name, collection.data);
                }
                console.log('\n\x1b[32m¡Actualización completada exitosamente!\x1b[0m');
            } catch (error) {
                console.error('\n\x1b[31m%s\x1b[0m', 'Ocurrió un error durante la actualización:');
                console.error(error);
            } finally {
                rl.close();
                process.exit(0);
            }
        } else {
            console.log('Actualización cancelada.');
            rl.close();
            process.exit(0);
        }
    });
}

main();
