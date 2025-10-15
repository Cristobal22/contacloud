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
5.  In this project, rename the `.env.example` file to `.env` if it exists, otherwise create it.
6.  Paste your Firebase config values into the `.env` file. Make sure to match each value with the correct `NEXT_PUBLIC_` variable name.

### IMPORTANT: Creating the First Admin User

For security and functionality, the first user with the `Admin` role must be created and configured manually. This is a **one-time setup** for your first administrator and is required to view the user management page.

**All users created via the Admin dashboard within the app will be automatically assigned the `Accountant` role.**

To create your first `Admin` user:
1.  **Sign up for a new account** in the application using the standard login page (e.g., with Google or Email/Password).
2.  **Go to your Firebase Console** and select your project.
3.  Navigate to **Build > Firestore Database**. Find the **`users`** collection and locate the document corresponding to the user you just created (the document ID is the user's UID). Click on the document, find the **`role`** field, change its value from `"Accountant"` to `"Admin"`, and click **Update**.
4.  **Set the Admin Custom Claim:** This is the most critical step. You must run a script on your local machine to grant your user admin privileges for backend security rules.
    *   **Install Firebase Admin SDK**: Open a terminal and run `npm install firebase-admin`.
    *   **Get Service Account Key**: In your Firebase Console, go to **Project settings > Service Accounts**. Click **Generate new private key** and save the downloaded file as `serviceAccountKey.json`.
    *   **Create a script**: Create a file named `set-admin-claim.js` and paste the following code into it. Place this file in the same directory as your `serviceAccountKey.json`.

        ```javascript
        // set-admin-claim.js
        const admin = require('firebase-admin');
        const serviceAccount = require('./serviceAccountKey.json'); // Make sure the path is correct

        // Initialize the app with a service account, granting admin privileges
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });

        // Get the UID of the user you want to make an admin from the Firebase Console
        const uid = 'PASTE_YOUR_USER_ID_HERE';

        admin.auth().setCustomUserClaims(uid, { role: 'Admin' })
          .then(() => {
            console.log(`Success! Custom claim set for user ${uid}. They are now an Admin.`);
            process.exit(0);
          })
          .catch((error) => {
            console.error('Error setting custom claim:', error);
            process.exit(1);
          });
        ```
    *   **Run the script**: Replace `'PASTE_YOUR_USER_ID_HERE'` in the script with your actual user UID. Then, run the script from your terminal: `node set-admin-claim.js`.
5.  **Log out and log back in** to the application. This is essential for your new admin permissions to take effect.

That's it! You will now have full administrative privileges.

### Running the Development Server

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the application**:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002` (or your configured port).

## Project Structure

- `src/app/`: Contains all the pages and layouts of the application, following the Next.js App Router structure.
    - `src/app/dashboard/`: Protected routes for the main accounting dashboard.
    - `src/app/login/`: The login page.
- `src/components/`: Reusable React components used throughout the application.
    - `src/components/ui/`: Components from shadcn/ui.
- `src/firebase/`: Configuration and hooks for interacting with Firebase services (Auth and Firestore).
- `src/lib/`: Utility functions and type definitions (`types.ts`).
- `docs/`: Contains the backend data schema definition (`backend.json`).
- `firestore.rules`: Contains the security rules for the Firestore database.
