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
