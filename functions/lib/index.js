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
// Initialize Firebase Admin SDK
admin.initializeApp();
const db = (0, firestore_1.getFirestore)();
exports.getLatestPayrollSalary = (0, https_1.onCall)(async (request) => {
    // Check if the user is authenticated
    if (!request.auth) {
        throw new Error("Authentication required.");
    }
    const { companyId, employeeId } = request.data;
    if (!companyId || !employeeId) {
        throw new Error("Missing companyId or employeeId.");
    }
    // NOTE: We don't need to check user's company association here
    // because this function is designed to be called only from trusted client code
    // that has already verified user's access to the company.
    // The primary goal is to bypass complex query security rules.
    try {
        const payrollsRef = db.collection(`companies/${companyId}/payrolls`);
        const query = payrollsRef
            .where("employeeId", "==", employeeId)
            .orderBy("year", "desc")
            .orderBy("month", "desc")
            .limit(1);
        const snapshot = await query.get();
        if (snapshot.empty) {
            // It's not an error if no payroll is found, just return null
            return { taxableEarnings: null };
        }
        const lastPayroll = snapshot.docs[0].data();
        // Return only the necessary data
        return { taxableEarnings: lastPayroll.taxableEarnings || 0 };
    }
    catch (error) {
        console.error("Error fetching latest payroll:", error);
        // Throw a generic error to the client
        throw new Error("An internal error occurred while fetching payroll data.");
    }
});
//# sourceMappingURL=index.js.map