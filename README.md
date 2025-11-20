# BaseImponible.cl - Official README

Este es el repositorio oficial para el proyecto BaseImponible.cl. Para información sobre marketing y características del producto, por favor consulta el archivo `docs/marketing-summary.md`.

---

## Configuración del Entorno de Desarrollo (Aplicación Principal)

Esta guía te ayudará a poner en marcha la aplicación web principal de Next.js.

### 1. Prerrequisitos

- **Node.js**: Asegúrate de tener instalada una versión de Node.js `20.x`, como se especifica en el archivo `package.json`. Se recomienda usar un gestor de versiones como `nvm`.

### 2. Instalación de Dependencias

Una vez que tengas clonado el repositorio, instala todas las dependencias necesarias con el siguiente comando:

```bash
npm install
```

### 3. Ejecutar el Servidor de Desarrollo

Para iniciar la aplicación en modo de desarrollo, ejecuta el script `dev`:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`. El servidor se recargará automáticamente cada vez que realices cambios en el código.

---

# Guía para Desarrolladores

Esta sección contiene información técnica esencial para operar y extender el proyecto. Su propósito es garantizar un flujo de trabajo eficiente y prevenir errores comunes de configuración que han causado problemas en el pasado.

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

---

## Guía de Despliegue y Solución de Errores

Esta sección documenta la configuración de despliegue y las soluciones a errores comunes encontrados durante el ciclo de vida del proyecto.

### **Plataforma de Despliegue**

*   **Servicio**: El proyecto está desplegado en **Firebase App Hosting**. Este servicio está diseñado para aplicaciones web con un backend (como Next.js) y gestiona el ciclo de compilación y despliegue automáticamente.
*   **Disparador**: Los despliegues se activan automáticamente con cada `push` a la rama `main` del repositorio en GitHub.

### **Configuración de Compilación (Build)**

*   **Motor de Node.js**: El entorno de compilación en Firebase App Hosting está configurado para usar **Node.js versión 20**. Esto es consistente con la variable `engines` en `package.json`.
*   **Comando de Compilación**: El comando correcto para compilar el proyecto es simplemente `next build`. Este se define en el script `build` del `package.json`.

### **Errores Comunes y Soluciones**

#### 1. **ERROR: `unknown option '--no-cache'` durante el despliegue**

*   **Causa**: Este error ocurrió porque se añadió el flag `--no-cache` al script `build` en `package.json`. Se intentó como una solución para un error de falta de espacio (`ENOSPC`) que ocurría en un entorno de despliegue incorrecto (Firebase Hosting Clásico).
*   **Solución**: El entorno de compilación de Firebase App Hosting (que usa el CLI de Vercel) no reconoce esta opción. **No se debe usar `--no-cache`**. El script de `build` debe ser únicamente `"build": "next build"`.

#### 2. **ERROR: `ENOSPC: no space left on device` durante el despliegue**

*   **Causa**: Este fue el error original que nos llevó por el camino equivocado. Fue causado por intentar desplegar una aplicación Next.js (que requiere un servidor) en **Firebase Hosting Clásico**, un servicio diseñado para sitios estáticos. El entorno de Hosting Clásico no está preparado para compilar proyectos de Next.js y se quedaba sin espacio.
*   **Solución**: La solución fundamental fue migrar el despliegue a **Firebase App Hosting**. Este servicio está diseñado específicamente para este tipo de aplicaciones y resuelve el problema de raíz.

#### 3. **ERROR: `fatal: unable to write loose object file: No space left on device` en el entorno local**

*   **Causa**: Este error ocurre al ejecutar comandos de `git` (como `git add` o `git commit`) y es una señal inequívoca de que **el disco duro del ordenador local está lleno**.
*   **Solución**: Liberar espacio en disco. La forma más rápida en el contexto de este proyecto es eliminar la carpeta `node_modules` y luego reinstalar las dependencias:
    ```bash
    # Paso 1: Eliminar la carpeta para liberar espacio
    rm -rf node_modules
    
    # Paso 2: (Opcional pero recomendado) Limpiar la caché de npm
    npm cache clean --force
    
    # Paso 3: Reinstalar las dependencias ahora que hay espacio
    npm install
    ```
---

### Arquitectura de Permisos y Acceso a Empresas

El sistema de permisos para acceder a la información de una empresa se basa en un único campo dentro de la colección `companies` de Firestore.

*   **Colección:** `companies`
*   **Documento:** `{companyId}`
*   **Campo Clave:** `memberUids` (un array de strings)

#### Lógica de Acceso

1.  **Rol `Admin`:** Un usuario cuyo documento en la colección `users` tiene el campo `role` con el valor `'Admin'` posee acceso universal a todas las empresas del sistema. Esta es una regla de omisión global.

2.  **Acceso General (Propietarios y Contadores):** Para cualquier otro usuario, el acceso a una empresa específica se concede si y solo si su `uid` (ID de usuario de Firebase Authentication) está incluido en el array `memberUids` del documento de esa empresa.

    *   **Ejemplo:** Si el usuario `user_abc` quiere acceder a la empresa `company_xyz`, el documento `companies/company_xyz` debe tener un campo `memberUids: [..., "user_abc", ...]`.

#### Creación de Empresas y Asociación de Usuarios

Es crucial entender que la lógica de negocio para crear una nueva empresa y establecer esta relación de permisos no reside en el código del frontend (el cliente).

*   La creación de una empresa se gestiona a través de una **Callable Cloud Function** de Firebase llamada `createCompanyAndAssociateUser`.
*   El frontend, a través del hook `useCreateCompany` (`src/features/companies/hooks/use-create-company.ts`), simplemente invoca esta función pasándole los datos básicos de la nueva empresa (nombre, RUT, etc.).
*   Es esta función en la nube la responsable de:
    1.  Crear el nuevo documento en la colección `companies`.
    2.  **Añadir el `uid` del usuario que la está creando al array `memberUids`**, estableciendo así la relación de propiedad y permiso inicial.

Cualquier depuración o modificación de la lógica de permisos en el backend que involucre el acceso a las empresas **debe** basarse en la comprobación del `uid` del solicitante contra el array `memberUids` del documento de la empresa.
