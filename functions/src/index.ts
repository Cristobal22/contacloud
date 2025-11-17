
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Admin SDK
admin.initializeApp();

// Define the structure of the data the function expects
interface CompanyData {
  name: string;
  rut: string;
}

export const createCompanyAndAssociateUser = functions
  .region("us-central1") // It's good practice to specify the region
  .https.onCall(async (data: CompanyData, context) => {
    // 1. Authentication Check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "A user must be authenticated to create a company."
      );
    }

    const uid = context.auth.uid;
    const companyData = data;

    // 2. Input Data Validation
    if (!companyData.name || !companyData.rut) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The 'name' and 'rut' fields are required."
      );
    }

    // 3. Atomic transaction to create the company and associate the user
    try {
      const userRef = admin.firestore().collection("users").doc(uid);

      const newCompanyId = await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "User document not found."
          );
        }

        // Create the new company
        const newCompanyRef = admin.firestore().collection("companies").doc();
        transaction.set(newCompanyRef, {
          ...companyData,
          ownerUid: uid,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          active: true, // Set company as active by default
          memberUids: [uid], // Add the creator as the first member
        });

        // Associate the new company with the user by updating the 'companyIds' MAP.
        transaction.update(userRef, {
          [`companyIds.${newCompanyRef.id}`]: true,
        });

        return newCompanyRef.id;
      });

      return { status: "success", companyId: newCompanyId };

    } catch (error) {
      console.error("Error in the company creation transaction:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      throw new functions.https.HttpsError(
        "internal",
        "An internal error occurred while saving company data.",
        errorMessage
      );
    }
  });
