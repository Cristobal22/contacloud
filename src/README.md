# Contador Cloud

Contador Cloud is a modern, multi-tenant accounting application designed for accountants to manage the finances of multiple companies securely and efficiently. This application is built as a robust prototype using Next.js, Firebase, and shadcn/ui, showcasing a complete and interactive user experience.

## Key Features

- **Multi-Tenant Architecture**: Securely manage multiple client companies with complete data isolation. The selected company context dynamically filters all data shown in the dashboard.
- **Firebase Integration**: Powered by Firebase for core backend services:
    - **Firestore**: Real-time database for all accounting data (companies, accounts, vouchers, employees, etc.).
    - **Firebase Authentication**: Secure user registration and login with Email/Password and Google providers.
- **Comprehensive Accounting Modules**:
    - **Dashboard**: An overview of key financial metrics.
    - **Core Accounting**: Manage Chart of Accounts, Vouchers, Purchases, Sales, and Fees.
    - **Reporting**: Generate dynamic reports like General Journal, General Ledger, Balances, and VAT Summaries based on real data.
    - **Employee Management**: Full CRUD functionality for employee records.
    - **Payroll Simulation**: A module to display simulated payroll slips based on employee data.
- **Modern & Responsive UI**: A professional and clean user interface built with **shadcn/ui** and **Tailwind CSS**, fully responsive for desktop and mobile devices.
- **Robust Error Handling**: Centralized error handling for Firestore permission errors, making debugging security rules easier.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Authentication](https://firebase.google.com/docs/auth)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn
- A Firebase project

### Firebase Setup

1.  Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2.  In your project, go to **Project settings** > **General**.
3.  Under "Your apps", create a new **Web app**.
4.  Copy the `firebaseConfig` object values.
5.  In this project, rename the `.env.example` file to `.env`.
6.  Paste your Firebase config values into the `.env` file. Make sure to match each value with the correct `NEXT_PUBLIC_` variable name.

### IMPORTANT: Creating the First Admin User

For security reasons, the first user with the `Admin` role must be created manually and assigned a **Firebase Custom Claim**. This is because Firestore Security Rules for listing users rely on this claim for efficient and secure role verification.

**All users created via the Admin dashboard will be automatically assigned the `Accountant` role in their Firestore document, but will not have a custom claim.**

To create your first true `Admin` user:
1.  **Sign up for a new account** using the standard login page (e.g., with Google or Email/Password).
2.  **Get the user's UID** from the Firebase Console -> Authentication tab.
3.  **Set a custom claim**. You must do this using the Firebase Admin SDK in a trusted server environment (like a Cloud Function or a local script). You cannot do this from the client-side code.

    *Example Node.js script using Firebase Admin SDK:*
    ```javascript
    // admin.js
    // IMPORTANT: Make sure to initialize the Admin SDK with your service account credentials.
    const admin = require('firebase-admin');
    const serviceAccount = require('./path/to/your/serviceAccountKey.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    const uid = 'PASTE_THE_USER_UID_HERE';

    admin.auth().setCustomUserClaims(uid, { role: 'Admin' })
      .then(() => {
        console.log('Successfully set Admin custom claim for user:', uid);
        process.exit(0);
      })
      .catch(error => {
        console.error('Error setting custom claim:', error);
        process.exit(1);
      });
    ```
4.  **Run the script**: `node admin.js`
5.  **Verify the user's role in Firestore**. After setting the claim, you should also go to your **Firestore Database**, navigate to the `users` collection, find the document with the user's UID, and ensure the `role` field is set to `Admin`.

### Running the Development Server

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the application**:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`.

## Project Structure

- `src/app/`: Contains all the pages and layouts of the application, following the Next.js App Router structure.
    - `src/app/dashboard/`: Protected routes for the main accounting dashboard.
    - `src/app/login/`: The login page.
    - `src/app/registro/`: The user registration page.
- `src/components/`: Reusable React components used throughout the application.
    - `src/components/ui/`: Components from shadcn/ui.
- `src/firebase/`: Configuration and hooks for interacting with Firebase services (Auth and Firestore).
- `src/lib/`: Utility functions and type definitions (`types.ts`).
- `docs/`: Contains the backend data schema definition (`backend.json`).
