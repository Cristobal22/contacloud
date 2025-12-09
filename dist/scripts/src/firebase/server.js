"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.initializeFirebaseAdmin = void 0;
const admin = __importStar(require("firebase-admin"));
// This pattern prevents redeclaration in development hot-reloads.
global.declareFirestore = global.declareFirestore || {};
// A function to initialize and get the Firestore database instance.
const initializeFirebaseAdmin = () => {
    // If the app is already initialized, return the existing db instance.
    if (admin.apps.length) {
        // Check if the db instance is cached in our global declaration.
        if (global.declareFirestore.db) {
            return global.declareFirestore.db;
        }
        const db_instance = admin.firestore();
        global.declareFirestore.db = db_instance;
        return db_instance;
    }
    // If not initialized, create a new instance.
    try {
        const serviceAccountString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (!serviceAccountString) {
            throw new Error('CRITICAL: GOOGLE_APPLICATION_CREDENTIALS_JSON env var is not set.');
        }
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK has been successfully initialized.');
        const db_instance = admin.firestore();
        global.declareFirestore.db = db_instance; // Cache the instance
        return db_instance;
    }
    catch (error) {
        console.error('FATAL: FIREBASE ADMIN SDK INITIALIZATION FAILED.', error.message);
        // Re-throw a more generic error to avoid leaking implementation details.
        throw new Error('Server configuration error: Firebase initialization failed.');
    }
};
exports.initializeFirebaseAdmin = initializeFirebaseAdmin;
// For legacy parts of the app that might still import `db` directly,
// we can try to provide it, but using the function is the robust way.
let db;
try {
    exports.db = db = (0, exports.initializeFirebaseAdmin)();
}
catch (e) {
    console.error("Failed to initialize db on module load. This might be expected in some environments. API routes should call initializeFirebaseAdmin() explicitly.");
}
