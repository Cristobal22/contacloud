# Instrucciones para Establecer un Administrador de Forma Segura

El script `set-admin-claim.js` ya no es necesario para establecer el rol de administrador. El nuevo flujo de trabajo simplificado se describe en el `README.md` principal. Este archivo se mantiene por motivos históricos pero puede ser eliminado.

El método actual consiste en modificar directamente el documento del usuario en la base de datos de Firestore para cambiar el campo `role` de `"Accountant"` a `"Admin"`.

**IMPORTANTE**: Para que la aplicación sea segura, todavía es fundamental que la cuenta de servicio de Firebase (`serviceAccountKey.json`) **NUNCA** se suba a un repositorio público como GitHub.

## ¿Por qué sucede el error `Push cannot contain secrets`?

Si has visto este error, es porque en un `commit` anterior, el archivo `serviceAccountKey.json` fue añadido al historial de Git. Aunque lo borres ahora, ese `commit` pasado sigue existiendo y GitHub lo detecta, bloqueando la subida para proteger tus credenciales.

## Pasos para Limpiar tu Historial y Subir tus Cambios

Si te enfrentas a este problema, sigue estos pasos **exactos** en la terminal para limpiar el `commit` problemático de tu historial y poder hacer `push` a GitHub.

### Paso 1: Elimina el archivo `serviceAccountKey.json` de tu proyecto

Si aún existe, bórralo. No debe estar en el repositorio.

### Paso 2: Ejecuta la herramienta para reescribir el historial

Este es el comando más importante. Va a recorrer todo tu historial y eliminará cualquier rastro del archivo `serviceAccountKey.json`. Copia y pégalo **exactamente** como está:

```bash
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch serviceAccountKey.json' --prune-empty --tag-name-filter cat -- --all
```

*Nota: Si ves advertencias, es normal. Lo importante es que el comando se complete.*

### Paso 3: Sube tu historial limpio a GitHub

Ahora que tu historial local está limpio, necesitas forzar la subida para que reemplace el historial defectuoso en GitHub.

```bash
git push origin main --force
```

Después de ejecutar estos comandos, tu repositorio estará sincronizado, seguro y libre del error.
