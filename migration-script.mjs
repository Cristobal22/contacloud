// migration-script.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ======================= INSTRUCCIONES IMPORTANTES =======================
//
// 1.  **Obtén tu Clave de Cuenta de Servicio:**
//     - Ve a la Consola de Firebase -> tu proyecto -> Engranaje (Configuración del proyecto) -> Cuentas de servicio.
//     - Haz clic en "Generar nueva clave privada" y guarda el archivo JSON que se descarga.
//
// 2.  **Coloca la Clave:**
//     - Renombra el archivo JSON descargado a `serviceAccountKey.json`.
//     - Colócalo en el mismo directorio donde ejecutarás este script.
//
// 3.  **Instala las dependencias:**
//     - Abre tu terminal y ejecuta: `npm install firebase-admin`
//
// 4.  **Ejecuta el script:**
//     - En tu terminal, ejecuta: `node migration-script.mjs`
//
// =========================================================================

// Importa la clave de cuenta de servicio que descargaste y renombraste.
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Inicializa el SDK de Admin de Firebase
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateCompanyIds() {
  console.log('Iniciando migración de `companyIds`...');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('No se encontraron usuarios en la base de datos.');
    return;
  }

  let migratedCount = 0;
  const batch = db.batch();

  snapshot.forEach(doc => {
    const user = doc.data();
    const userId = doc.id;

    // La condición clave: buscamos usuarios que tengan `companyIds` y que sea un array.
    if (user.companyIds && Array.isArray(user.companyIds)) {
      console.log(`- Usuario encontrado para migrar: ${user.email || userId}`);
      
      const companyIdsArray = user.companyIds;
      
      // Convertimos el array a un mapa/objeto
      const companyIdsMap = companyIdsArray.reduce((acc, companyId) => {
        if (companyId) { // Nos aseguramos de que el ID no sea nulo o indefinido
          acc[companyId] = true;
        }
        return acc;
      }, {});

      console.log(`  -> de ${JSON.stringify(companyIdsArray)} a ${JSON.stringify(companyIdsMap)}`);

      // Añadimos la operación de actualización al batch
      const userRef = db.collection('users').doc(userId);
      batch.update(userRef, { companyIds: companyIdsMap });
      migratedCount++;
    }
  });

  if (migratedCount > 0) {
    console.log(`\nSe encontraron ${migratedCount} perfiles de usuario para actualizar. Guardando cambios...`);
    await batch.commit();
    console.log('¡Migración completada! Todos los perfiles han sido actualizados al nuevo formato.');
  } else {
    console.log('\nNo se encontraron perfiles que necesiten migración. Todos los datos ya están en el formato correcto.');
  }
}

migrateCompanyIds().catch(error => {
  console.error('Ocurrió un error durante la migración:', error);
});
