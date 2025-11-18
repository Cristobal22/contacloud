# BaseImponible.cl - Official README

Este es el repositorio oficial para el proyecto BaseImponible.cl. Para información sobre marketing y características del producto, por favor consulta el archivo `docs/marketing-summary.md`.

---

# Guía para Desarrolladores

Esta sección contiene información técnica esencial para configurar, operar y extender el proyecto. Su propósito es garantizar un flujo de trabajo eficiente y prevenir errores comunes de configuración que han causado problemas en el pasado.

## Scripts de Administración (Backend / Tareas de Mantenimiento)

El directorio `/scripts` contiene scripts de Node.js/TypeScript diseñados para ejecutar tareas administrativas directamente contra la base de datos (ej: migraciones, limpieza de datos, reportes específicos, etc.). La ejecución de estos scripts es una operación delicada y requiere seguir este procedimiento al pie de la letra.

### **[CRÍTICO] Requisito de Autenticación y Variables de Entorno**

A diferencia de la aplicación web, que se ejecuta en un entorno de servidor gestionado, estos scripts se ejecutan localmente en tu máquina. Por lo tanto, no tienen acceso automático a las variables de entorno del servidor.

Para autenticarse con Firebase, cada script **debe** tener acceso a las credenciales de la cuenta de servicio.

1.  **Archivo `.env.local`**: Asegúrate de que el archivo `.env.local` exista en la raíz del proyecto.
2.  **Variable de Credenciales**: Este archivo debe contener la variable de entorno `GOOGLE_APPLICATION_CREDENTIALS_JSON`, que almacena el contenido JSON completo de la clave de la cuenta de servicio de Firebase.

### **Cómo Ejecutar un Script de Forma Segura**

Para ejecutar un script que necesita acceso a la base de datos, **siempre** debes usar el siguiente comando. Intentar ejecutarlo de otra manera (`ts-node mi-script.ts`) resultará en un fallo de autenticación de Firebase, como se ha comprobado en depuraciones anteriores.

```bash
npx ts-node -r dotenv/config --project tsconfig.scripts.json RUTA_DEL_SCRIPT [ARGUMENTOS]
```

**Desglose del Comando:**

*   `npx ts-node`: Es el ejecutor que compila y corre el script de TypeScript.
*   `-r dotenv/config`: **(EL PASO CLAVE)**. Este flag (abreviatura de `--require`) instruye a Node.js para que cargue y ejecute el módulo `dotenv/config` **antes** de que cualquier línea de tu script sea procesada. Esto garantiza que las variables del archivo `.env.local` ya existan en el entorno (`process.env`) cuando el módulo de Firebase intente inicializarse.
*   `--project tsconfig.scripts.json`: Indica a `ts-node` que use la configuración de compilación específica para scripts, que es diferente de la configuración de la aplicación principal.
*   `RUTA_DEL_SCRIPT`: La ruta al archivo del script, por ejemplo: `scripts/DANGEROUS-delete-all-vouchers.ts`.
*   `[ARGUMENTOS]`: Cualquier argumento adicional que el script espere recibir.

**Ejemplo Práctico:**

Para ejecutar el script que borra todos los vouchers de una empresa específica, el comando sería:

```bash
# Formato: npx ts-node -r dotenv/config --project tsconfig.scripts.json <script> <companyId>
npx ts-node -r dotenv/config --project tsconfig.scripts.json scripts/DANGEROUS-delete-all-vouchers.ts YZjYRraLdHxVkEs186z7
```

### Creando un Nuevo Script de Administración

Cuando necesites crear un nuevo script:

1.  Crea tu nuevo archivo `.ts` en el directorio `/scripts`.
2.  Importa el objeto `db` directamente desde `../src/firebase/server`. No necesitas inicializar Firebase ni cargar `dotenv` manualmente dentro del script; el comando de ejecución se encarga de ello.
3.  Si usas parámetros de bucles como en `.forEach(doc => ...)` en una consulta de Firestore, recuerda añadir el tipo explícito para cumplir con las reglas de TypeScript y evitar errores de compilación: `.forEach((doc: QueryDocumentSnapshot) => ...)`.
4.  Para ejecutarlo, sigue siempre las instrucciones de la sección anterior.
