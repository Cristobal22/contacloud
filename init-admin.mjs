// @ts-check
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createInterface } from 'readline';
import { readFileSync } from 'fs';

/**
 * Script para promover un usuario existente al rol de 'Admin'.
 * 
 * Uso:
 * 1. Asegúrate de tener el archivo `service-account.json` en la raíz del proyecto.
 * 2. Ejecuta `npm run init-admin` o `node init-admin.mjs` en tu terminal.
 * 3. Ingresa el correo electrónico del usuario que deseas promover.
 */

async function main() {
  try {
    // 1. Cargar las credenciales de la cuenta de servicio
    const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

    // 2. Inicializar la app de Firebase Admin
    initializeApp({
      credential: cert(serviceAccount)
    });

    const firestore = getFirestore();
    const auth = getAuth();
    
    console.log('Firebase Admin SDK inicializado correctamente.');

    // 3. Obtener el email del usuario desde la terminal
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const email = await new Promise((resolve) => {
      rl.question('Por favor, ingresa el email del usuario a promover como Admin: ', (input) => {
        resolve(input);
        rl.close();
      });
    });

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error('Email inválido. Por favor, intenta de nuevo.');
      return;
    }

    console.log(`Buscando usuario con email: ${email}...`);

    // 4. Buscar el usuario en Firebase Authentication
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    console.log(`Usuario encontrado: ${userRecord.displayName || uid}. Actualizando rol a "Admin"...`);

    // 5. Actualizar el documento del usuario en Firestore
    const userDocRef = firestore.collection('users').doc(uid);
    await userDocRef.update({
      role: 'Admin'
    });

    console.log('\x1b[32m%s\x1b[0m', `¡Éxito! El usuario ${email} ahora tiene el rol de Administrador.`);
    console.log('Por favor, cierra sesión y vuelve a iniciar sesión en la aplicación para que los cambios surtan efecto.');

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Ocurrió un error durante el proceso:');
    if (error.code === 'auth/user-not-found') {
        console.error(`No se encontró ningún usuario con el email proporcionado.`);
    } else if (error.code === 'ENOENT') {
        console.error('No se encontró el archivo `service-account.json`. Asegúrate de que exista en la raíz del proyecto.');
    }
    else {
        console.error(error);
    }
  }
}

main();
