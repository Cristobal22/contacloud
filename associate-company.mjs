
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

async function associateCompanyToUser() {
  console.log('Iniciando el proceso de asociación de empresa...');

  // 1. Get the first user (assuming it's you)
  const userRecords = await auth.listUsers(1);
  if (userRecords.users.length === 0) {
    console.error('No se encontraron usuarios en Firebase Authentication.');
    return;
  }
  const user = userRecords.users[0];
  const userId = user.uid;
  const userEmail = user.email;
  console.log(`- Usuario encontrado: ${userEmail} (ID: ${userId})`);

  // 2. Get the first company
  const companiesRef = db.collection('companies');
  const companySnapshot = await companiesRef.limit(1).get();
  if (companySnapshot.empty) {
    console.error('No se encontraron empresas en la base de datos.');
    return;
  }
  const company = companySnapshot.docs[0];
  const companyId = company.id;
  const companyName = company.data().name;
  console.log(`- Empresa encontrada: ${companyName} (ID: ${companyId})`);

  // 3. Update the user's profile
  const userRef = db.collection('users').doc(userId);
  const userProfile = await userRef.get();

  if (!userProfile.exists) {
    console.error(`No se encontró un perfil de usuario para el ID: ${userId}`);
    return;
  }

  const userData = userProfile.data();
  const currentCompanyIds = userData.companyIds || {};

  if (currentCompanyIds[companyId]) {
    console.log(`El usuario ya está asociado con la empresa. No se necesita ninguna acción.`);
    return;
  }

  console.log('Asociando empresa al usuario...');
  await userRef.update({
    [`companyIds.${companyId}`]: true
  });

  console.log('¡Asociación completada exitosamente!');
}

associateCompanyToUser().catch(console.error);
