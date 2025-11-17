# BaseImponible.cl

BaseImponible.cl es una moderna aplicación de contabilidad multi-tenant diseñada para que los contadores gestionen las finanzas de múltiples empresas de forma segura y eficiente. Esta aplicación está construida como un prototipo robusto utilizando Next.js, Firebase y shadcn/ui, mostrando una experiencia de usuario completa e interactiva.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/hosting)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/)
- **IA Generativa**: [Genkit](https://firebase.google.com/docs/genkit) (para futuras integraciones)

## Arquitectura y Conceptos Clave

Esta sección detalla la arquitectura de alto nivel para que un nuevo desarrollador pueda entender rápidamente el funcionamiento interno del sistema.

### 1. Modelo Multi-Tenant

El núcleo de la aplicación es su arquitectura multi-tenant, diseñada para que cada contador (`Accountant`) tenga su propio espacio de trabajo aislado.

- **Colección `users`**: Almacena los perfiles de los usuarios. Cada documento de usuario contiene un `role` ('Admin' o 'Accountant') y un campo `companyIds`.
    - **`companyIds`**: Este campo es **crítico** para los permisos. Debe ser un **Objeto (mapa)** donde cada ID de compañía es una clave y su valor es `true`. Ejemplo: `{"companyId1": true, "companyId2": true}`. Ver la sección de Troubleshooting para más detalles.
- **Colección `companies`**: Almacena la información de cada empresa cliente. La propiedad `ownerId` en cada documento de empresa lo vincula directamente con el usuario contador que la creó.
- **Aislamiento de Datos**: Las reglas de seguridad de Firestore (`firestore.rules`) garantizan que un contador solo pueda leer o escribir datos en las subcolecciones de las empresas que le pertenecen (validadas a través de `isUserAssociatedWithCompany`).

### 2. Control de Acceso Basado en Roles (RBAC)

El sistema define dos roles de usuario principales con permisos claramente definidos en `firestore.rules`:

- **`Accountant` (Contador)**:
    - Puede crear, leer, actualizar y eliminar (`CRUD`) las empresas que posee.
    - Tiene acceso `CRUD` a todos los datos contables y operativos *dentro* de sus propias empresas (ej. `companies/{companyId}/vouchers`).
    - No puede ver ni gestionar empresas o datos de otros contadores.
    - No puede ver la lista de todos los los usuarios.

- **`Admin` (Administrador)**:
    - Tiene permisos `CRUD` sobre la colección `users`, lo que le permite crear, modificar y eliminar cuentas de contadores.
    - Puede gestionar los datos maestros y parámetros globales del sistema (ej. `/tax-parameters`, `/afp-entities`).
    - **Importante**: Un `Admin` no tiene acceso a los datos contables de las empresas de los contadores, garantizando la privacidad del cliente final.

### 3. Flujo de Datos en el Frontend

La interfaz de usuario está diseñada para ser dinámica y reactiva al contexto del usuario.

- **`useUser` y `useUserProfile`**: Estos hooks personalizados gestionan la autenticación y cargan el perfil del usuario, determinando su rol y permisos.
- **`DashboardLayout`**: Este layout actúa como un controlador principal. Renderiza un diseño diferente (`AdminDashboardLayout` o `AccountantDashboardLayout`) basado en el rol del usuario.
- **`SelectedCompanyContext`**: Para los contadores, este Contexto de React es fundamental. Almacena la empresa seleccionada actualmente y la pone a disposición de todos los componentes hijos. Esto asegura que todas las consultas a la base de datos y las operaciones se realicen en el contexto de la empresa correcta.

## Puntos Críticos y Troubleshooting

Esta sección documenta lecciones aprendidas durante el desarrollo que son vitales para evitar y diagnosticar problemas complejos.

### 1. La Estructura de Datos de `companyIds` es Crucial

El error más difícil de diagnosticar en este proyecto ha estado relacionado con la estructura del campo `companyIds` en la colección `users`.

- **Estructura Correcta**: Un **Objeto (mapa)** donde las llaves son los IDs de las compañías.
  ```json
  "companyIds": {
    "Bkp3r9551hbDJ3xZumup": true,
    "JQRIR3pKvjcD8VAhhleZ": true
  }
  ```
- **Estructura Incorrecta**: Un Array de strings (`["id1", "id2"]`) o un solo string.

**Impacto**: Toda la lógica de permisos en el backend (rutas API en `src/app/api`) y las reglas de seguridad (`firestore.rules`) están diseñadas para leer las llaves de este objeto. Si la estructura es incorrecta, el servidor fallará con errores **`403 (Forbidden)`** o **`500 (Internal Server Error)`** que pueden parecer inexplicables, ya que el usuario parece tener los roles y permisos correctos a simple vista.

### 2. Cómo Diagnosticar Errores de Servidor (500 Internal Server Error)

Cuando una operación en el navegador falla con un error 500, el mensaje de error en la consola del navegador es a menudo inútil (ej. `Server error response: ""`).

La verdadera causa del error **siempre** se encuentra en la **terminal donde se ejecuta el servidor de desarrollo (`npm run dev`)**.

- **Paso 1**: Realiza la acción en el navegador para que ocurra el error.
- **Paso 2**: Inmediatamente, revisa la ventana de la terminal.
- **Paso 3**: Busca un bloque de texto de error detallado. El código en las rutas API está diseñado para imprimir la causa raíz del error allí (ej. `Error during payroll annulment: ...`). Sin el log de la terminal del servidor, es imposible saber qué falló.


## Key Features

- **Arquitectura Multi-Tenant Segura**:
    - **Roles de Usuario**: `Admin` para gestión de plataforma y `Accountant` para gestión contable.
    - **Aislamiento de Datos**: Garantizado por reglas de Firestore robustas.
    - **Gestión de Usuarios**: Los `Admin` pueden crear y gestionar contadores, incluyendo la duración de sus suscripciones.

- **Integración con Firebase**:
    - **Firestore**: Base de datos en tiempo real para todos los datos de la aplicación.
    - **Firebase Authentication**: Registro y login seguro con Email/Contraseña y Google.
    - **Reglas de Seguridad**: `firestore.rules` como pilar de la seguridad y la lógica de negocio.

- **Módulos Contables Completos**:
    - **Dashboard Interactivo**: Visión general de activos, pasivos, patrimonio y resultados.
    - **Plan de Cuentas Jerárquico**: Estructura de cuentas anidada con cálculo de saldos agregados.
    - **Gestión de Comprobantes Profesional**: Flujo con estados "Borrador" y "Contabilizado". Un comprobante editado se revierte a "Borrador" para garantizar la integridad de los informes.
    - **Informes Precisos**: Libro Diario, Libro Mayor y Balances que **solo** consideran comprobantes en estado "Contabilizado".
    - **Gestión de Remuneraciones**: Módulo completo para la gestión de empleados y el procesamiento de liquidaciones de sueldo.
    - **Datos Maestros Centralizados**: Los `Admin` pueden actualizar datos globales (AFP, Salud, IUT, etc.) desde la UI.

- **Procesos Críticos Asistidos**:
    - **Centralización de Remuneraciones**: Genera automáticamente el asiento contable de centralización de sueldos.
    - **Centralización de Compras/Ventas**: Importa documentos del SII y genera los asientos correspondientes.

- **UI Moderna y Responsiva**:
    - Construida con **shadcn/ui** y **Tailwind CSS**.
    - **Menú de Comandos (Cmd+K)** para navegación rápida.
    - **Modo Oscuro** y diseño adaptable.

## Getting Started

### Prerequisites

- Node.js (v18 o superior)
- npm o yarn
- Un proyecto de Firebase con **facturación activada** (necesario para futuros servicios de Google Cloud como Genkit).

### 1. Firebase Setup

1.  Crea un proyecto en la [Firebase Console](https://console.firebase.google.com/).
2.  Ve a **Configuración del proyecto** > **General**.
3.  En "Tus apps", crea una **Aplicación web**.
4.  Copia los valores del objeto `firebaseConfig`.
5.  En el proyecto, renombra `.env.example` a `.env` y pega tus valores de configuración.

### 2. Crear el Primer Usuario Administrador

1.  **Regístrate en la aplicación**: Usa la página de login para crear tu primera cuenta. Por defecto, tendrá el rol `Accountant`.
2.  **Ejecuta el Script de Admin**: En la terminal, ejecuta:
    ```bash
    npm run init-admin
    ```
3.  Ingresa el email del usuario que registraste. El script lo promoverá a `Admin`.
4.  **Cierra y vuelve a iniciar sesión** para que los nuevos permisos surtan efecto.

### 3. Running the Development Server

1.  **Instala las dependencias**:
    ```bash
    npm install
    ```
2.  **Ejecuta la aplicación**:
    ```bash
    npm run dev
    ```
La aplicación estará disponible en `http://localhost:9004`.

## Project Structure

- `src/app/`: Páginas y layouts (App Router). El `dashboard/layout.tsx` es clave.
- `src/components/`: Componentes de React. `admin/` contiene componentes solo para el rol Admin.
- `src/firebase/`: Configuración de Firebase y hooks personalizados (`useUser`, `useCollection`, etc.).
- `src/lib/`: Lógica de negocio, tipos de TypeScript (`types.ts`), y datos de inicialización (`seed-data.ts`).
- `functions/`: Código para futuras implementaciones de Firebase Functions.
- `firestore.rules`: **Crítico para la seguridad**. Define todos los permisos de acceso a la base de datos.
- `init-admin.mjs`: Script para inicializar el primer usuario `Admin`.
