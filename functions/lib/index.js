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
exports.createCompanyAndAssociateUser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Admin SDK
admin.initializeApp();
exports.createCompanyAndAssociateUser = functions
    .region("us-central1")
    .https.onCall(async (data, context) => {
    // 1. Authentication Check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "A user must be authenticated to create a company.");
    }
    const uid = context.auth.uid;
    const companyData = data;
    // 2. Input Data Validation
    if (!companyData.name || !companyData.rut) {
        throw new functions.https.HttpsError("invalid-argument", "The 'name' and 'rut' fields are required.");
    }
    // 3. Atomic transaction to create the company and associate the user
    try {
        const userRef = admin.firestore().collection("users").doc(uid);
        const newCompanyId = await admin.firestore().runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new functions.https.HttpsError("not-found", "User document not found.");
            }
            // Create the new company
            const newCompanyRef = admin.firestore().collection("companies").doc();
            transaction.set(newCompanyRef, Object.assign(Object.assign({}, companyData), { ownerUid: uid, 
                // Add the creator's UID to the 'memberUids' array
                memberUids: [uid], createdAt: admin.firestore.FieldValue.serverTimestamp() }));
            // Associate the new company with the user
            transaction.update(userRef, {
                companyIds: admin.firestore.FieldValue.arrayUnion(newCompanyRef.id),
            });
            return newCompanyRef.id;
        });
        return { status: "success", companyId: newCompanyId };
    }
    catch (error) {
        console.error("Error in the company creation transaction:", error);
        // Re-throw formatted HttpsError if it's already one
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // For any other error, throw a generic internal error
        const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
        throw new functions.https.HttpsError("internal", "An internal error occurred while saving company data.", errorMessage);
    }
});
//# sourceMappingURL=index.js.map