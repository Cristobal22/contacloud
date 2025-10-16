# Instrucciones para Establecer un Administrador de Forma Segura

El script `set-admin-claim.js` ha sido vaciado para prevenir la exposición accidental de credenciales sensibles en el repositorio de código. El archivo `serviceAccountKey.json` NUNCA debe ser subido a GitHub.

## ¿Por qué sucedió el error?

El error `Push cannot contain secrets` ocurrió porque el archivo `serviceAccountKey.json` fue detectado en tu historial de `git`. GitHub bloquea esto automáticamente para proteger tus credenciales.

## Pasos para Configurar un Admin (Método Seguro)

Para configurar tu primer usuario como 'Admin' sin comprometer la seguridad, sigue estos pasos:

1.  **Crea el archivo `serviceAccountKey.json` localmente**: Tal como lo hiciste antes, obtén tu clave desde la consola de Firebase y pégala en un archivo llamado `serviceAccountKey.json` en la raíz de tu proyecto.

2.  **Verifica que `.gitignore` ignore el archivo**: El archivo `.gitignore` ya está configurado para ignorar `serviceAccountKey.json`. Esto evitará que lo subas accidentalmente en el futuro.

3.  **Restaura el script temporalmente**: Copia el siguiente código y pégalo temporalmente en el archivo `set-admin-claim.js`:

    ```javascript
    const admin = require('firebase-admin');
    // IMPORTANTE: Asegúrate de que el archivo serviceAccountKey.json esté en la raíz del proyecto.
    const serviceAccount = require('./serviceAccountKey.json');

    // Reemplaza esto con el UID del usuario que quieres que sea Admin.
    const uid = 'PASTE_YOUR_USER_ID_HERE';

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        admin.auth().setCustomUserClaims(uid, { role: 'Admin' }).then(() => {
            console.log(`\n\x1b[32mÉXITO:\x1b[0m Se ha asignado el rol de 'Admin' al usuario con UID: ${uid}`);
            console.log("Por favor, sal y vuelve a iniciar sesión en la aplicación para que los cambios surtan efecto.");
            process.exit(0);
        }).catch((error) => {
            console.error('\x1b[31mError al establecer el custom claim:\x1b[0m', error);
            process.exit(1);
        });

    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error('\n\x1b[31mError:\x1b[0m No se encontró el archivo \x1b[33mserviceAccountKey.json\x1b[0m.');
            console.log('Por favor, descárgalo desde tu consola de Firebase y colócalo en la raíz del proyecto.');
        } else {
            console.error('\x1b[31mOcurrió un error inesperado:\x1b[0m', error);
        }
        process.exit(1);
    }
    ```

4.  **Ejecuta el script**: Abre la terminal y ejecuta `node set-admin-claim.js`.

5.  **¡MUY IMPORTANTE! Vuelve a vaciar el script**: Una vez que termines, borra el contenido de `set-admin-claim.js` de nuevo para no tener código que haga referencia a la clave.

## ¿Cómo subir mis cambios ahora?

Para poder hacer `push` a GitHub, necesitas eliminar la clave del historial. Abre tu terminal y ejecuta:

```bash
# 1. Elimina la referencia al archivo del historial de Git
git rm --cached serviceAccountKey.json

# 2. Crea un nuevo commit con el archivo eliminado y los cambios que hice
git add .
git commit -m "chore: Remove service account key from tracking"

# 3. Ahora sí, sube los cambios a GitHub
git push
```
