# BaseImponible.cl

BaseImponible.cl es una moderna aplicación de contabilidad multi-tenant diseñada para que los contadores gestionen las finanzas de múltiples empresas de forma segura y eficiente. Esta aplicación está construida como un prototipo robusto utilizando Next.js, Firebase y shadcn/ui, mostrando una experiencia de usuario completa e interactiva.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Funciones Serverless**: [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/)

## ⚠️ Configuración Crítica del Entorno

Para que la aplicación funcione, es **esencial** configurar correctamente el entorno de Firebase y las variables locales. Los errores de configuración son la causa más común de problemas.

### 1. Prerrequisitos

- **Node.js**: **v20.0.0 o superior**.
- **npm** o **yarn**.
- Una cuenta de Google.

### 2. Configuración del Proyecto Firebase

1.  **Crear Proyecto**: Ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Activar Facturación**: En la configuración del proyecto, selecciona el plan **Blaze (pago por uso)**. Esto es **obligatorio** para poder desplegar Cloud Functions.
3.  **Crear App Web**:
    - En la "Configuración del proyecto" > "General", crea una nueva **Aplicación web**.
    - Nómbrala y registra la aplicación.
    - Firebase te mostrará un objeto `firebaseConfig`. Copia estos valores.

### 3. Configuración de Variables de Entorno

1.  En la raíz de este proyecto, crea un nuevo archivo llamado **`.env.local`**.
2.  Copia el contenido del archivo `.env.example` y pégalo en tu nuevo archivo `.env.local`.
3.  Rellena los valores con las claves que obtuviste de la configuración de tu App Web en Firebase. El archivo `.env.local` se verá así y **no debe ser subido a GitHub**:

    ```bash
    # Variables de entorno para el cliente Next.js
    NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy...YOUR_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
    NEXT_PUBLIC_FIREBASE_APP_ID="1:12345:web:abcdef123"
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-ABCDEF123"
    ```

### 4. Configuración de Cloud Functions y Permisos

El proyecto utiliza una Cloud Function (`getLatestPayrollSalary`) para sugerir el sueldo base. Para que funcione, necesita una configuración específica:

1.  **Región de la Función**: Al desplegar la función (o si ya existe), asegúrate de que esté configurada en la región **`us-central1`**.
2.  **Runtime de la Función**: La función debe usar el entorno de ejecución **Node.js 20**.
3.  **Permisos de Invocación**:
    - Ve a la [Consola de Google Cloud](https://console.cloud.google.com/) y selecciona tu proyecto.
    - Navega a "Cloud Functions".
    - Selecciona la función `getLatestPayrollSalary`.
    - Ve a la pestaña "Permisos".
    - Haz clic en "Conceder acceso".
    - En el campo "Principales nuevas", escribe `allUsers`.
    - En el campo "Seleccionar un rol", elige **`Cloud Functions`** > **`Invocador de Cloud Functions`**.
    - Guarda los cambios.

### 5. Instalación y Ejecución Local

1.  **Instala las dependencias**:
    ```bash
    npm install
    ```
2.  **Ejecuta el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:9003`.

### 6. Creación del Primer Usuario Administrador

El sistema necesita un usuario `Admin` para gestionar contadores y parámetros.

1.  **Regístrate en la aplicación**: Usa la página de login para crear tu primera cuenta. Por defecto, tendrá el rol `Accountant`.
2.  **Promover a Admin**: Abre una terminal en la raíz del proyecto y ejecuta:
    ```bash
    npm run init-admin
    ```
3.  El script te pedirá el email del usuario que acabas de registrar. Ingrésalo.
4.  **¡Importante!**: Cierra sesión en la aplicación y vuelve a iniciarla para que los nuevos permisos de `Admin` surtan efecto.

## Despliegue (Deployment)

Este proyecto está configurado para **Firebase App Hosting**, no para el servicio de *Hosting Clásico*. Esto se debe a que utiliza las funciones de servidor de Next.js.

- El repositorio incluye un workflow de GitHub Actions (`.github/workflows/firebase-hosting-pull-request.yml`) que despliega automáticamente las vistas previas de los Pull Requests.
- Para desplegar a producción, sigue la [guía oficial de Firebase App Hosting](https://firebase.google.com/docs/app-hosting).

## Estructura del Proyecto

- `src/app/`: Páginas y layouts (App Router).
- `src/components/`: Componentes de React, incluyendo UI de shadcn.
- `src/firebase/`: Configuración y hooks para interactuar con Firebase. El archivo clave es `config.ts`, donde se define la región de las Functions.
- `src/lib/`: Funciones de utilidad, tipos de datos y datos de inicialización (`seed-data.ts`).
- `functions/`: Código fuente de las Cloud Functions. El CLI de Firebase puede generar aquí sus propios archivos `.env.*` para gestionar las variables del backend.
- `firestore.rules`: Reglas de seguridad para Firestore.
- `init-admin.mjs`: Script para inicializar el primer usuario administrador.
