
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// Initialize Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function listUserAssociations() {
  console.log('Obteniendo las asociaciones de empresas para cada usuario...');

  try {
    const listUsersResult = await auth.listUsers(1000); // Get all users (up to 1000)

    if (listUsersResult.users.length === 0) {
      console.log('No se encontraron usuarios en Firebase Authentication.');
      return;
    }

    console.log('--- ASOCIACIONES DE USUARIOS ---\n');

    for (const userRecord of listUsersResult.users) {
      console.log(`- Usuario: ${userRecord.email} (ID: ${userRecord.uid})`);
      
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.log('  Este usuario no tiene un documento de perfil en Firestore.\n');
        continue;
      }

      const userData = userDoc.data();
      const companyIds = userData.companyIds;

      if (companyIds && Object.keys(companyIds).length > 0) {
        console.log('  Asociado a las siguientes Company IDs:');
        for (const companyId in companyIds) {
            console.log(`    - ${companyId}`);
        }
      } else {
        console.log('  No está asociado a ninguna empresa.\n');
      }
       console.log('------------------------------------\n');
    }

  } catch (error) {
    console.error('Ocurrió un error al obtener las asociaciones:', error.message);
  }
}

listUserAssociations();
