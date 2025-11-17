"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_1 = require("../src/lib/firebase/admin");
async function addEconomicIndicators() {
    try {
        console.log('Conectando a Firebase...');
        const adminApp = await (0, admin_1.getAdminApp)();
        const firestore = adminApp.firestore();
        const collectionName = 'economic-indicators';
        const documentId = '2025-6'; // Corresponde a Junio 2025
        console.log(`Verificando si el documento '${documentId}' ya existe en '${collectionName}'`);
        const docRef = firestore.collection(collectionName).doc(documentId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            console.log(`El documento '${documentId}' ya existe. No se requiere ninguna acción.`);
            return; // Si ya existe, no hacemos nada.
        }
        console.log(`El documento '${documentId}' no existe. Creando y añadiendo datos...`);
        // Estos son los valores que insertaremos. Puedes ajustarlos si es necesario.
        const indicators = {
            year: 2025,
            month: 6,
            uf: 37500.0, // Valor estimado para UF
            utm: 65000.0, // Valor estimado para UTM
            gratificationCap: 216666.0 // Valor estimado para el tope de gratificación
        };
        await docRef.set(indicators);
        console.log('¡Éxito!');
        console.log(`Se han añadido los indicadores económicos para Junio de 2025 en la colección '${collectionName}'.`);
    }
    catch (error) {
        console.error('Ha ocurrido un error al intentar añadir los indicadores económicos:', error);
        // Si ocurre un error, el script terminará con un código de salida diferente a 0.
        process.exit(1);
    }
}
// Ejecutamos la función principal y cerramos la conexión cuando termina.
addEconomicIndicators().then(() => {
    console.log('Script finalizado correctamente.');
    process.exit(0);
}).catch(() => {
    // El error ya se ha impreso en la consola, así que solo salimos.
    process.exit(1);
});
