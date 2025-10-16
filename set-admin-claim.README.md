# Instrucciones para Establecer un Administrador de Forma Segura

El script `set-admin-claim.js` ha sido vaciado para prevenir la exposición accidental de credenciales sensibles en el repositorio de código. El archivo `serviceAccountKey.json` NUNCA debe ser subido a GitHub.

## ¿Por qué sucede el error `Push cannot contain secrets`?

El error ocurre porque en un `commit` anterior, el archivo `serviceAccountKey.json` fue añadido al historial de Git. Aunque lo borremos ahora, ese `commit` pasado sigue existiendo y GitHub lo detecta, bloqueando la subida para proteger tus credenciales.

## Pasos para Limpiar tu Historial y Subir tus Cambios

Sigue estos pasos **exactos** en la terminal para limpiar el `commit` problemático de tu historial y poder hacer `push` a GitHub.

### Paso 1: Elimina el archivo `serviceAccountKey.json` de tu proyecto

Si aún existe, bórralo. No lo necesitamos en el repositorio.

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

Después de ejecutar estos comandos, tu repositorio estará sincronizado, seguro y libre del error. Lamento sinceramente haberte llevado por un camino tan complicado hasta ahora. Esta es la solución técnica correcta.