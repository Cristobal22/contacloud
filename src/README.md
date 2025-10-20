
# Contador Cloud

Contador Cloud es una moderna aplicación de contabilidad multi-tenant diseñada para que los contadores gestionen las finanzas de múltiples empresas de forma segura y eficiente. Esta aplicación está construida como un prototipo robusto utilizando Next.js, Firebase y shadcn/ui, mostrando una experiencia de usuario completa e interactiva.

## Key Features

- **Arquitectura Multi-Tenant Segura**:
    - **Roles de Usuario**: El sistema distingue entre `Admin` (para la gestión de la plataforma y los contadores) y `Accountant` (para la gestión contable de sus propias empresas).
    - **Aislamiento de Datos**: Un contador solo puede ver y gestionar las empresas que él mismo ha creado. Las reglas de seguridad de Firestore garantizan que los datos de una empresa solo sean accesibles por su propietario. El rol de `Admin` está estrictamente limitado a la gestión de usuarios y **no tiene acceso a los datos de las empresas**.
    - **Gestión de Usuarios**: Los administradores pueden crear nuevos usuarios contadores directamente desde su panel de control.

- **Integración con Firebase**:
    - **Firestore**: Base de datos en tiempo real para todos los datos contables (empresas, cuentas, comprobantes, empleados, etc.).
    - **Firebase Authentication**: Registro y login de usuarios seguro con proveedores de Email/Contraseña y Google.
    - **Reglas de Seguridad**: Reglas robustas en Firestore que garantizan que un usuario solo pueda acceder a los datos que le corresponden.

- **Módulos Contables Completos**:
    - **Dashboard**: Una visión general de las métricas financieras clave.
    - **Contabilidad Principal**: Gestiona el Plan de Cuentas, Comprobantes, Compras, Ventas y Honorarios.
    - **Informes**: Genera informes dinámicos como Libro Diario, Libro Mayor, Balances y Resúmenes de IVA basados en datos reales.
    - **Gestión de Empleados**: Funcionalidad completa de creación, lectura, actualización y eliminación (CRUD) para los registros de los empleados, con cálculos automáticos de gratificación.
    - **Simulación de Nóminas**: Un módulo para visualizar liquidaciones de sueldo simuladas basadas en los datos de los empleados.

- **Procesos Críticos Asistidos por IA**:
    - **Centralización de Remuneraciones**: Genera automáticamente el asiento contable de centralización de sueldos.
    - **Centralización RCV (Próximamente)**: Funcionalidad planificada para generar asientos a partir del Registro de Compras y Ventas del SII.

- **UI Moderna y Responsiva**:
    - Un interfaz de usuario profesional y limpio construido con **shadcn/ui** y **Tailwind CSS**.
    - **Menú de Comandos (Cmd+K)**: Un buscador global para navegar rápidamente por páginas, empresas, cuentas y empleados.
    - Totalmente responsivo para dispositivos de escritorio y móviles.

- **Manejo Robusto de Errores**:
    - Manejo centralizado de errores de permisos de Firestore, facilitando la depuración de reglas de seguridad durante el desarrollo.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Autenticación**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/)
- **IA Generativa**: [Genkit](https://firebase.google.com/docs/genkit)

## Getting Started

### Prerequisites

- Node.js (v18 o later recomendado)
- npm o yarn
- Un proyecto de Firebase

### Firebase Setup

1.  Crea un proyecto en la [Firebase Console](https://console.firebase.google.com/).
2.  En tu proyecto, ve a **Configuración del proyecto** > **General**.
3.  En "Tus apps", crea una nueva **Aplicación web**.
4.  Copia los valores del objeto `firebaseConfig`.
5.  En este proyecto, crea un archivo llamado `.env` en la raíz (puedes renombrar `.env.example` si existe).
6.  Pega tus valores de configuración de Firebase en el archivo `.env`. Asegúrate de que cada valor coincida con el nombre de la variable `NEXT_PUBLIC_` correspondiente.

### IMPORTANTE: Flujo de Usuarios y Empresas

#### 1. Creación del Primer Usuario Administrador (Proceso Único)

El primer usuario `Admin` es indispensable para empezar a crear las cuentas de los contadores. El proceso es sencillo y se realiza con un script.

1.  **Regístrate en la aplicación**: Usa la página de login para crear tu primera cuenta (con Google o Email/Contraseña). Por defecto, se creará con el rol `Accountant`.

2.  **Ejecuta el Script de Admin**: Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:
    ```bash
    npm run init-admin
    ```
3.  El script te pedirá el email del usuario que acabas de registrar. Ingrésalo y el script lo promoverá a `Admin`.

4.  **Cierra y vuelve a iniciar sesión**: ¡Este paso es esencial! Cierra sesión en la aplicación y vuelve a iniciarla para que tus nuevos permisos de administrador surtan efecto.

¡Listo! Ahora tendrás privilegios de `Admin`, podrás ver la sección "Gestión de Usuarios" en el dashboard y empezar a crear las cuentas para los contadores.

#### 2. Creación de Usuarios Contadores (Rol `Admin`)

Una vez que eres `Admin`, puedes crear las cuentas para otros usuarios:

1.  Navega a la sección **Gestión de Usuarios** en el dashboard.
2.  Haz clic en **"Agregar Usuario"**.
3.  Completa el email y el nombre del nuevo usuario. El sistema automáticamente:
    - Creará la cuenta en Firebase Authentication.
    - Le asignará el rol de `Accountant`.
    - Enviará un correo electrónico para que el nuevo usuario establezca su contraseña.

#### 3. Creación y Gestión de Empresas (Rol `Accountant`)

Un usuario con rol `Accountant` es quien gestiona las empresas cliente. El flujo es el siguiente:

1.  El `Accountant` inicia sesión en la plataforma.
2.  Navega a la sección **Empresas**.
3.  Hace clic en **"Agregar Empresa"** para crear una nueva ficha de cliente.
4.  Una vez creada, la empresa aparecerá en su lista y podrá seleccionarla desde el menú superior para empezar a trabajar en ella (añadir plan de cuentas, comprobantes, etc.).
5.  **Importante**: Un contador solo verá las empresas que él mismo ha creado. Los datos están completamente aislados entre contadores.

### Running the Development Server

1.  **Instala las dependencias** (ejecuta esto en la terminal integrada):
    ```bash
    npm install
    ```

2.  **Ejecuta la aplicación**:
    ```bash
    npm run dev
    ```

La aplicación estará disponible en `http://localhost:9002` (o el puerto que hayas configurado).

## Project Structure

- `src/app/`: Contiene todas las páginas y layouts de la aplicación, siguiendo la estructura del App Router de Next.js.
    - `src/app/dashboard/`: Rutas protegidas para el panel de control principal.
    - `src/app/login/`: La página de inicio de sesión.
- `src/components/`: Componentes de React reutilizables.
    - `src/components/ui/`: Componentes de shadcn/ui.
    - `src/components/admin/`: Componentes específicos para el rol de Administrador.
- `src/firebase/`: Configuración y hooks para interactuar con Firebase (Auth y Firestore). Contiene la lógica para `useUser`, `useCollection`, etc.
- `src/lib/`: Funciones de utilidad (`utils.ts`) y definiciones de tipos de datos (`types.ts`).
- `src/ai/`: Contiene los flujos de Genkit para las funcionalidades de IA.
- `docs/`: Contiene la definición del esquema de datos del backend (`backend.json`).
- `firestore.rules`: Contiene las reglas de seguridad para la base de datos Firestore.

