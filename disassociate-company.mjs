
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

// --- CONFIGURATION ---
const USER_EMAIL_TO_UPDATE = 'benjamin.m.zapata.s@gmail.com';
const COMPANY_ID_TO_REMOVE = '8RG8LgIDLN0LhBh8JiT4';
// --- END CONFIGURATION ---

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function disassociateCompanyFromUser() {
  console.log('Iniciando el proceso de desasociación...');

  try {
    // 1. Get the user by email
    const userRecord = await auth.getUserByEmail(USER_EMAIL_TO_UPDATE);
    const userId = userRecord.uid;
    console.log(`- Usuario encontrado: ${userRecord.email} (ID: ${userId})`);

    // 2. Get the company for logging purposes
    const companyRef = db.collection('companies').doc(COMPANY_ID_TO_REMOVE);
    const companyDoc = await companyRef.get();
    const companyName = companyDoc.exists ? companyDoc.data().name : 'Nombre no encontrado';
    console.log(`- Empresa a desasociar: ${companyName} (ID: ${COMPANY_ID_TO_REMOVE})`);

    // 3. Update the user's profile to remove the company association
    const userRef = db.collection('users').doc(userId);
    const userProfile = await userRef.get();

    if (!userProfile.exists) {
      throw new Error(`No se encontró un perfil de usuario para el ID: ${userId}`);
    }

    const userData = userProfile.data();
    if (!userData.companyIds || !userData.companyIds[COMPANY_ID_TO_REMOVE]) {
      console.log('El usuario no parece estar asociado con esta empresa. No se necesita ninguna acción.');
      return;
    }
    
    console.log('Eliminando asociación de la empresa en el perfil del usuario...');
    
    // Use Firestore's FieldValue.delete() to remove the key from the map
    await userRef.update({
      [`companyIds.${COMPANY_ID_TO_REMOVE}`]: FieldValue.delete()
    });

    console.log('¡Desasociación completada exitosamente!');

  } catch (error) {
    console.error('Ocurrió un error durante el proceso:', error.message);
  }
}

disassociateCompanyFromUser();
