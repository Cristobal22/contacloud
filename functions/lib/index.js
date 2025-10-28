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
exports.deleteCompany = void 0;
const admin = __importStar(require("firebase-admin"));
const firebase_functions_1 = require("firebase-functions");
admin.initializeApp();
const db = admin.firestore();
/**
 * Deletes a company and all its associated sub-collections.
 * @param {string} companyId - The ID of the company to delete.
 * @param {object} context - The context of the function call.
 * @returns {Promise<{success: boolean; message: string;}>} - A promise that resolves with a success or error message.
 */
exports.deleteCompany = firebase_functions_1.https.onCall(async (data, context) => {
    firebase_functions_1.logger.info("deleteCompany function triggered");
    // 1. Authentication Check: Ensure the user is authenticated.
    if (!context.auth) {
        firebase_functions_1.logger.error("Authentication check failed: User is not authenticated.");
        throw new firebase_functions_1.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { companyId } = data;
    if (!companyId || typeof companyId !== "string") {
        firebase_functions_1.logger.error("Invalid companyId provided.");
        throw new firebase_functions_1.https.HttpsError("invalid-argument", "The function must be called with a valid companyId string.");
    }
    const userId = context.auth.uid;
    firebase_functions_1.logger.info(`Attempting to delete company ${companyId} by user ${userId}`);
    const companyRef = db.collection("companies").doc(companyId);
    const userRef = db.collection("users").doc(userId);
    try {
        // 2. Authorization Check: Verify the user is the owner of the company.
        const companyDoc = await companyRef.get();
        if (!companyDoc.exists) {
            firebase_functions_1.logger.error(`Company ${companyId} not found.`);
            throw new firebase_functions_1.https.HttpsError("not-found", "Company not found.");
        }
        const companyData = companyDoc.data();
        if ((companyData === null || companyData === void 0 ? void 0 : companyData.ownerId) !== userId) {
            firebase_functions_1.logger.error(`User ${userId} is not the owner of company ${companyId}.`);
            throw new firebase_functions_1.https.HttpsError("permission-denied", "You are not authorized to delete this company.");
        }
        firebase_functions_1.logger.info(`User ${userId} authorized to delete company ${companyId}.`);
        // 3. Delete all sub-collections.
        const subCollections = [
            "accounts", "employees", "payrolls", "purchases",
            "sales", "subjects", "vouchers", "cost-centers", "fees",
        ];
        for (const subCollection of subCollections) {
            firebase_functions_1.logger.info(`Deleting sub-collection: ${subCollection}`);
            const snapshot = await companyRef.collection(subCollection).get();
            if (snapshot.empty) {
                firebase_functions_1.logger.info(`Sub-collection ${subCollection} is already empty.`);
                continue;
            }
            const batch = db.batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            firebase_functions_1.logger.info(`Successfully deleted ${snapshot.size} documents from ${subCollection}.`);
        }
        // 4. Delete the main company document.
        firebase_functions_1.logger.info(`Deleting main company document: ${companyId}`);
        await companyRef.delete();
        // 5. Update the user's document to remove the company ID.
        firebase_functions_1.logger.info(`Removing company ${companyId} from user ${userId}'s companyIds.`);
        await userRef.update({
            companyIds: admin.firestore.FieldValue.arrayRemove(companyId),
        });
        firebase_functions_1.logger.info(`Successfully deleted company ${companyId}.`);
        return { success: true, message: "Company deleted successfully." };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error deleting company:", error);
        if (error instanceof firebase_functions_1.https.HttpsError) {
            throw error; // Re-throw HttpsError directly
        }
        throw new firebase_functions_1.https.HttpsError("internal", "An unexpected error occurred while deleting the company.", error);
    }
});
//# sourceMappingURL=index.js.map