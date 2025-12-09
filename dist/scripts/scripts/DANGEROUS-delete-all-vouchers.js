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
const server_1 = require("../src/firebase/server");
const readline = __importStar(require("readline"));
const BATCH_SIZE = 500;
// Helper para crear una interfaz de pregunta/respuesta en la consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const askConfirmation = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
};
const deleteAllVouchers = async (companyId) => {
    if (!companyId) {
        console.error("ERROR: Company ID es requerido. Operación terminada.");
        process.exit(1);
    }
    if (!server_1.db) {
        console.error("[FATAL ERROR] La conexión a la base de datos de Firestore no está disponible.");
        process.exit(1);
    }
    console.log(`[DANGER] Este script borrará permanentemente TODOS los vouchers de la empresa con ID: ${companyId}`);
    const confirmation = await askConfirmation(`\n> Para confirmar esta acción, por favor escribe el ID de la empresa nuevamente: `);
    if (confirmation !== companyId) {
        console.log("\nLa confirmación no coincide. Operación cancelada de forma segura.");
        rl.close();
        process.exit(0);
    }
    console.log("\nConfirmación aceptada. Iniciando proceso de borrado...");
    const vouchersRef = server_1.db.collection(`companies/${companyId}/vouchers`);
    try {
        let deletedCount = 0;
        let snapshot;
        do {
            snapshot = await vouchersRef.limit(BATCH_SIZE).get();
            if (snapshot.empty) {
                break;
            }
            const batch = server_1.db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            deletedCount += snapshot.size;
            console.log(`...se ha borrado un lote de ${snapshot.size} vouchers.`);
        } while (snapshot.size > 0);
        if (deletedCount === 0) {
            console.log(`[SUCCESS] No se encontraron vouchers para la empresa ${companyId}. No se borró nada.`);
        }
        else {
            console.log(`[SUCCESS] Proceso finalizado. Se han borrado un total de ${deletedCount} vouchers para la empresa ${companyId}.`);
        }
    }
    catch (error) {
        console.error("[FATAL ERROR] Ocurrió un error durante el proceso de borrado:", error);
        process.exit(1);
    }
    finally {
        rl.close();
        process.exit(0);
    }
};
const companyId = process.argv[2];
deleteAllVouchers(companyId);
