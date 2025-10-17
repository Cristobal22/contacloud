
# Contador Cloud

Contador Cloud es una moderna aplicación de contabilidad multi-tenant diseñada para que los contadores gestionen las finanzas de múltiples empresas de forma segura y eficiente. Esta aplicación está construida como un prototipo robusto utilizando Next.js, Firebase y shadcn/ui, mostrando una experiencia de usuario completa e interactiva.

## Key Features

- **Arquitectura Multi-Tenant Segura**:
    - **Roles de Usuario**: El sistema distingue entre `Admin` (para la gestión de la plataforma y los contadores) y `Accountant` (para la gestión contable de las empresas asignadas).
    - **Aislamiento de Datos**: Un contador solo puede ver y gestionar las empresas que un administrador le ha asignado. El contexto de la empresa seleccionada filtra dinámicamente todos los datos mostrados.
    - **Gestión de Usuarios**: Los administradores pueden crear nuevos usuarios contadores directamente desde el panel de control.

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

### IMPORTANTE: Creación del Primer Usuario Administrador

Para que la aplicación funcione y sea segura, el primer usuario con el rol `Admin` **debe crearse y configurarse manualmente**. Este es un **proceso único** para tu primer administrador y es **indispensable** para poder ver el panel de gestión de usuarios y empezar a crear empresas.

**Punto Clave**: Todos los usuarios que crees después desde el panel de administración de la aplicación se crearán automáticamente con el rol `Accountant`.

Sigue estos pasos **dentro de este entorno de desarrollo en la nube**:

1.  **Regístrate en la aplicación**: Usa la página de login para crear una nueva cuenta (con Google o Email/Contraseña). Por defecto, se creará como `Accountant`.

2.  **Modifica el Rol en Firestore**:
    - Ve a tu **Firebase Console** y selecciona tu proyecto.
    - Navega a **Build > Firestore Database**.
    - Busca la colección `users` y localiza el documento del usuario que acabas de crear (el ID del documento es el UID del usuario).
    - Haz clic en el documento, busca el campo `role`, cambia su valor de `"Accountant"` a `"Admin"` y haz clic en **Actualizar**.

3.  **Establece el Custom Claim de Administrador**: Este es el paso más crítico para la seguridad del backend. Debes ejecutar un script en la terminal integrada de este IDE para otorgar privilegios de administrador.
    - **Abre la Terminal**: En la parte inferior de tu IDE, abre el panel "Terminal".
    - **Obtén la Clave de Cuenta de Servicio**: En tu Firebase Console, ve a **Configuración del proyecto > Cuentas de servicio**. Haz clic en **Generar nueva clave privada** y guarda el archivo JSON descargado en tu ordenador.
    - **Crea el archivo `serviceAccountKey.json`**: En este IDE, crea un nuevo archivo en el directorio raíz llamado `serviceAccountKey.json`. Copia el contenido del archivo que descargaste y pégalo aquí.
    - **Ejecuta el script**: El proyecto ya incluye un archivo llamado `set-admin-claim.js`. Ábrelo y reemplaza `'PASTE_YOUR_USER_ID_HERE'` con tu UID de usuario real (puedes encontrarlo en la sección de Authentication de la Firebase Console). Luego, en la **terminal integrada**, ejecuta los siguientes comandos uno por uno:
        
        Primero, instala el paquete necesario:
        ```bash
        npm install firebase-admin
        ```
        
        Luego, ejecuta el script:
        ```bash
        node set-admin-claim.js
        ```

4.  **Cierra y vuelve a iniciar sesión**: ¡Este paso es esencial! Cierra sesión en la aplicación y vuelve a iniciarla para que tus nuevos permisos de administrador surtan efecto.

¡Listo! Ahora tendrás privilegios de administrador completos, podrás ver la sección "Gestión de Usuarios" y empezar a crear empresas y asignar contadores.

### Asignación de Empresas a Contadores

Una vez que eres `Admin` y has creado usuarios `Accountant`, el proceso para asignarles empresas es el siguiente:

1.  Como `Admin`, ve a la sección **Empresas** y crea las empresas cliente que necesites.
2.  Luego, ve a **Gestión de Usuarios** y haz clic en "Editar Usuario" en el contador que deseas gestionar.
3.  En el formulario de edición, verás una sección para asignar las empresas disponibles. Selecciona las que correspondan y guarda los cambios.
4.  La próxima vez que el contador inicie sesión, solo verá y podrá trabajar con las empresas que le has asignado.

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
