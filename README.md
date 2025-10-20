# Contador Cloud

Contador Cloud es una moderna aplicación de contabilidad multi-tenant diseñada para que los contadores gestionen las finanzas de múltiples empresas de forma segura y eficiente. Esta aplicación está construida como un prototipo robusto utilizando Next.js, Firebase y shadcn/ui, mostrando una experiencia de usuario completa e interactiva.

## Key Features

- **Arquitectura Multi-Tenant Segura**:
    - **Roles de Usuario**: El sistema distingue entre `Admin` (para la gestión de la plataforma y los contadores) y `Accountant` (para la gestión contable de sus propias empresas).
    - **Aislamiento de Datos**: Un contador solo puede ver y gestionar las empresas que él mismo ha creado. El rol `Admin` está limitado a la gestión de usuarios y no tiene acceso a los datos de las empresas.
    - **Gestión de Usuarios**: Los administradores pueden crear nuevos usuarios contadores directamente desde su panel de control.

- **Integración con Firebase**:
    - **Firestore**: Base de datos en tiempo real para todos los datos contables y de la aplicación.
    - **Firebase Authentication**: Registro y login de usuarios seguro con proveedores de Email/Contraseña y Google.
    - **Reglas de Seguridad**: Reglas robustas en Firestore que garantizan que un usuario solo pueda acceder a los datos que le corresponden.
    - **Firebase App Hosting**: Despliegue continuo integrado con GitHub Actions.

- **Módulos Contables Completos**:
    - **Dashboard Interactivo**: Una visión general de las métricas financieras clave.
    - **Plan de Cuentas Jerárquico**: Permite cargar un plan predeterminado, crearlo desde cero o importarlo. La interfaz visualiza la estructura anidada de las cuentas.
    - **Gestión de Comprobantes Profesional**: Flujo de trabajo completo con estados "Borrador" y "Contabilizado". Un comprobante contabilizado puede ser editado, pero se revierte a "Borrador" para garantizar la integridad de los informes.
    - **Informes Precisos**: Libro Diario, Libro Mayor y Balances que **solo** consideran comprobantes contabilizados, asegurando la fiabilidad de los datos.
    - **Gestión de Remuneraciones**: Módulo completo para la gestión de empleados y el procesamiento de liquidaciones de sueldo.
    - **Datos Maestros Centralizados**: Los administradores pueden actualizar datos esenciales como entidades de AFP, Salud, parámetros de IUT y Asignación Familiar directamente desde la interfaz de usuario.

- **Procesos Críticos Asistidos por IA**:
    - **Centralización de Remuneraciones**: Genera automáticamente el asiento contable de centralización de sueldos a partir de las liquidaciones procesadas.

- **UI Moderna y Responsiva**:
    - Interfaz profesional construida con **shadcn/ui** y **Tailwind CSS**.
    - **Menú de Comandos (Cmd+K)**: Un buscador global para navegar rápidamente por la aplicación.
    - **Modo Oscuro**: Apariencia personalizable para comodidad del usuario.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/hosting)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/)
- **IA Generativa**: [Genkit](https://firebase.google.com/docs/genkit)

## Getting Started

### Prerequisites

- Node.js (v18 o superior recomendado)
- npm o yarn
- Un proyecto de Firebase con la **facturación activada** (necesario para Genkit y servicios de Google Cloud).

### 1. Firebase Setup

1.  Crea un proyecto en la [Firebase Console](https://console.firebase.google.com/).
2.  En tu proyecto, ve a **Configuración del proyecto** > **General**.
3.  En "Tus apps", crea una nueva **Aplicación web**.
4.  Copia los valores del objeto `firebaseConfig`.
5.  En este proyecto, crea un archivo `.env` en la raíz (puedes renombrar `.env.example`).
6.  Pega tus valores de configuración en el `.env`, asegurándote de que coincidan con las variables `NEXT_PUBLIC_`.

### 2. Crear el Primer Usuario Administrador (Flujo Simplificado)

El primer usuario `Admin` es indispensable para empezar a crear las cuentas de los contadores y gestionar los parámetros.

1.  **Regístrate en la aplicación**: Usa la página de login para crear tu primera cuenta (con Google o Email/Contraseña). Por defecto, se creará con el rol `Accountant`.
2.  **Ejecuta el Script de Admin**: Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:
    ```bash
    npm run init-admin
    ```
3.  El script te pedirá el email del usuario que acabas de registrar. Ingrésalo y el script lo promoverá a `Admin`.
4.  **Cierra y vuelve a iniciar sesión**: ¡Este paso es esencial! Cierra sesión en la aplicación y vuelve a iniciarla para que tus nuevos permisos de administrador surtan efecto.

¡Listo! Ahora tendrás privilegios de `Admin` y podrás gestionar usuarios y parámetros.

### 3. Actualizar Parámetros Globales (Tarea de Admin)

Con el tiempo, los parámetros económicos y previsionales (UTM, sueldo mínimo, tablas de impuestos, etc.) cambian. Para mantener la aplicación al día, un administrador debe seguir estos pasos:

1.  **Asegúrate de tener los datos actualizados en el código**: Un desarrollador debe primero actualizar los valores en el archivo `src/lib/seed-data.ts`.
2.  **Inicia Sesión como Admin**: Accede a la aplicación con tu cuenta de administrador.
3.  **Navega a la Página de Parámetros**: Ve a la sección correspondiente (ej. Remuneraciones > Parámetros IUT).
4.  **Selecciona el Período**: Elige el mes y año que deseas actualizar.
5.  **Carga los Nuevos Datos**: Haz clic en el botón **"Cargar Parámetros Predeterminados"**. Esto leerá los nuevos datos del archivo `seed-data.ts` y los guardará en la base de datos para el período seleccionado.

### 4. Running the Development Server

1.  **Instala las dependencias**:
    ```bash
    npm install
    ```
2.  **Ejecuta la aplicación**:
    ```bash
    npm run dev
    ```
La aplicación estará disponible en `http://localhost:9002`.

## Flujo de Trabajo

- **Rol Admin**: Crea y gestiona las cuentas de los `Accountant` desde la sección "Gestión de Usuarios". Actualiza los parámetros globales del sistema desde las páginas de parámetros correspondientes (ej. Parámetros IUT, AFP, etc.).
- **Rol Accountant**:
    1. Inicia sesión y navega a **Empresas** para crear una nueva ficha de cliente.
    2. Al crear la empresa, se le redirige a la configuración para cargar el **Plan de Cuentas Predeterminado** o empezar uno desde cero.
    3. Una vez configurada, puede empezar a gestionar los módulos de contabilidad, remuneraciones e informes para esa empresa.

## Project Structure

- `src/app/`: Páginas y layouts (App Router).
- `src/components/`: Componentes de React, incluyendo UI de shadcn.
- `src/firebase/`: Configuración y hooks para interactuar con Firebase.
- `src/lib/`: Funciones de utilidad, tipos de datos y datos de inicialización (`seed-data.ts`).
- `src/ai/`: Flujos de Genkit para funcionalidades de IA.
- `firestore.rules`: Reglas de seguridad para Firestore.
- `.github/workflows/`: Workflows de CI/CD para despliegue automático.
- `init-admin.mjs`: Script para inicializar el primer usuario administrador.
