
// scripts/update-nov-2025-parameters.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Asumimos que las credenciales de servicio de Google Cloud están configuradas en el entorno de ejecución.
// Por ejemplo, a través de la variable de entorno GOOGLE_APPLICATION_CREDENTIALS
try {
  initializeApp();
} catch (e) {
  console.log('Firebase already initialized');
}


const db = getFirestore();

const YEAR = 2025;
const MONTH = 11;
const UTM_NOV_2025 = 69542;

// I. Parámetros Mensuales Básicos
async function updateEconomicIndicators() {
  const docId = `${YEAR}-${String(MONTH).padStart(2, '0')}`;
  const data = {
    year: YEAR,
    month: MONTH,
    uf: 39643.59,
    utm: UTM_NOV_2025,
    minWage: 529000,
    gratificationCap: Math.round((4.75 * 529000) / 12), // 209146
    uta: 834504,
  };
  await db.collection('economic-indicators').doc(docId).set(data);
  console.log(`[+] Indicadores Económicos para ${docId} actualizados.`);
}

// II. Parámetros Anuales y Topes Imponibles
async function updateTaxableCaps() {
  const docId = String(YEAR);
  const data = {
    year: YEAR,
    afpCap: 87.8,
    afcCap: 131.9,
  };
  await db.collection('taxable-caps').doc(docId).set(data, { merge: true });
  console.log(`[+] Topes Imponibles para el año ${docId} actualizados.`);
}

// III. Tasas de Cotización Obligatoria (AFP)
async function updateAfpRates() {
  const afpRates = [
    { name: 'Capital', rate: 11.54 },
    { name: 'Cuprum', rate: 11.54 },
    { name: 'Habitat', rate: 11.37 },
    { name: 'PlanVital', rate: 11.26 },
    { name: 'Provida', rate: 11.55 },
    { name: 'Modelo', rate: 10.68 },
    { name: 'Uno', rate: 10.56 },
  ];

  const batch = db.batch();
  for (const afp of afpRates) {
    const docRef = db.collection('afp-entities').doc(); // Firestore generará un ID único
    batch.set(docRef, {
      name: afp.name,
      year: YEAR,
      month: MONTH,
      mandatoryContribution: afp.rate,
    });
  }
  await batch.commit();
  console.log(`[+] Tasas de ${afpRates.length} AFPs para ${MONTH}/${YEAR} actualizadas.`);
}

// IV. Tramos de Asignación Familiar
async function updateFamilyAllowance() {
  const brackets = [
    { tramo: 'A', desde: 1, hasta: 620251, monto: 22007 },
    { tramo: 'B', desde: 620252, hasta: 905941, monto: 13505 },
    { tramo: 'C', desde: 905942, hasta: 1412957, monto: 4267 },
    { tramo: 'D', desde: 1412958, hasta: Infinity, monto: 0 },
  ];

  const batch = db.batch();
  for (const bracket of brackets) {
    const docRef = db.collection('family-allowance-parameters').doc(); // ID único
    batch.set(docRef, {
      ...bracket,
      year: YEAR,
      month: MONTH,
    });
  }
  await batch.commit();
  console.log(`[+] ${brackets.length} tramos de Asignación Familiar para ${MONTH}/${YEAR} actualizados.`);
}

// V. Tabla de Impuesto Único
async function updateTaxBrackets() {
  const taxBrackets = [
    { desdeUTM: 0, hastaUTM: 13.5, factor: 0, rebajaCLP: 0 },
    { desdeUTM: 13.5, hastaUTM: 30, factor: 0.04, rebajaCLP: 37553 },
    { desdeUTM: 30, hastaUTM: 50, factor: 0.08, rebajaCLP: 154671 },
    { desdeUTM: 50, hastaUTM: 70, factor: 0.135, rebajaCLP: 430505 },
    { desdeUTM: 70, hastaUTM: 90, factor: 0.23, rebajaCLP: 1098541 },
    { desdeUTM: 90, hastaUTM: 120, factor: 0.304, rebajaCLP: 1765735 },
    { desdeUTM: 120, hastaUTM: 310, factor: 0.35, rebajaCLP: 2348167 },
    { desdeUTM: 310, hastaUTM: Infinity, factor: 0.4, rebajaCLP: 3595667 },
  ];

  // La colección 'tax-parameters' no parece estar versionada por fecha, por lo que la limpiaremos y re-poblaremos.
  const snapshot = await db.collection('tax-parameters').get();
  const deleteBatch = db.batch();
  snapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();
  console.log('[!] Tabla de Impuesto Único anterior eliminada.');
  
  const addBatch = db.batch();
  for (const bracket of taxBrackets) {
    const docRef = db.collection('tax-parameters').doc(); // ID único
    addBatch.set(docRef, {
      desdeUTM: bracket.desdeUTM,
      hastaUTM: bracket.hastaUTM,
      factor: bracket.factor,
      // Convertimos la rebaja de CLP a UTM, ya que así lo espera el backend.
      rebajaUTM: bracket.rebajaCLP / UTM_NOV_2025,
    });
  }
  await addBatch.commit();
  console.log(`[+] ${taxBrackets.length} nuevos tramos de Impuesto Único añadidos.`);
}


async function main() {
  console.log('Iniciando actualización de parámetros para Noviembre 2025...');
  await updateEconomicIndicators();
  await updateTaxableCaps();
  await updateAfpRates();
  await updateFamilyAllowance();
  await updateTaxBrackets();
  console.log('\n--- Actualización Completada Exitosamente ---');
}

main().catch(err => {
  console.error('\n*** ERROR DURANTE LA ACTUALIZACIÓN ***');
  console.error(err);
  process.exit(1);
});
