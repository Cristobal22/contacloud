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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestPayrollSalary = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
// Securely initialize the Firebase Admin SDK only once
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = (0, firestore_1.getFirestore)();
exports.getLatestPayrollSalary = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    // 1. Check for authentication
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    // 2. Validate input data
    const { companyId, employeeId } = request.data;
    if (!companyId || !employeeId) {
        throw new https_1.HttpsError("invalid-argument", "Missing companyId or employeeId.");
    }
    // 3. Perform the database query
    try {
        const payrollsRef = db.collection(`companies/${companyId}/payrolls`);
        const query = payrollsRef
            .where("employeeId", "==", employeeId)
            .orderBy("year", "desc")
            .orderBy("month", "desc")
            .limit(1);
        const snapshot = await query.get();
        if (snapshot.empty) {
            // ALWAYS return the same shape
            return { baseIndemnizacion: null };
        }
        const lastPayroll = snapshot.docs[0].data();
        // Fallback logic for data consistency
        const suggestedValue = (_b = (_a = lastPayroll.baseIndemnizacion) !== null && _a !== void 0 ? _a : lastPayroll.taxableEarnings) !== null && _b !== void 0 ? _b : 0;
        // ALWAYS return the same shape
        return { baseIndemnizacion: suggestedValue };
    }
    catch (error) {
        console.error("Error fetching latest payroll for employee:", employeeId, "in company:", companyId, error);
        // Log the detailed error on the server, but throw a generic one to the client
        // This helps debugging without exposing implementation details.
        throw new https_1.HttpsError("internal", "An internal error occurred while fetching payroll data.");
    }
});
//# sourceMappingURL=index.js.map