"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminApp = getAdminApp;
exports.getAdminFirestore = getAdminFirestore;
exports.getAdminAuth = getAdminAuth;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
// No inicializamos la app aquí. Solo la declaramos.
function initializeAdminApp() {
    // Esta función contiene la lógica de inicialización, pero solo se llamará cuando sea necesario.
    // Vercel deployment
    if (process.env.VERCEL_ENV && process.env.FIREBASE_ADMIN_CREDENTIALS) {
        console.log('Initializing Firebase Admin SDK for Vercel deployment...');
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
        return firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    // Local development
    const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
    if (!credentialsJson) {
        throw new Error('FATAL: FIREBASE_ADMIN_CREDENTIALS environment variable is not set.');
    }
    const trimmedCredentials = credentialsJson.trim();
    try {
        console.log('Initializing Firebase Admin SDK from environment variable (local)...');
        const serviceAccount = JSON.parse(trimmedCredentials);
        return firebase_admin_1.default.initializeApp({
            credential: firebase_admin_1.default.credential.cert(serviceAccount),
        });
    }
    catch (e) {
        console.error('FATAL: Could not parse FIREBASE_ADMIN_CREDENTIALS.', e);
        throw new Error('Failed to parse Firebase credentials.');
    }
}
/**
 * Obtiene la instancia singleton de la Firebase Admin App.
 * Si la app no está inicializada, la inicializa.
 * Esta es la única función que se debe usar para obtener la app de admin.
 */
function getAdminApp() {
    if (firebase_admin_1.default.apps.length > 0) {
        return firebase_admin_1.default.apps[0];
    }
    return initializeAdminApp();
}
// Las otras funciones de ayuda ahora usan getAdminApp() para asegurar la inicialización.
function getAdminFirestore() {
    const app = getAdminApp();
    return firebase_admin_1.default.firestore(app);
}
function getAdminAuth() {
    const app = getAdminApp();
    return firebase_admin_1.default.auth(app);
}
