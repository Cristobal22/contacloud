
import * as admin from "firebase-admin";
import { https, logger } from "firebase-functions";

admin.initializeApp();

const db = admin.firestore();

/**
 * Deletes a company and all its associated sub-collections.
 * @param {string} companyId - The ID of the company to delete.
 * @param {object} context - The context of the function call.
 * @returns {Promise<{success: boolean; message: string;}>} - A promise that resolves with a success or error message.
 */
export const deleteCompany = https.onCall(async (data, context) => {
  logger.info("deleteCompany function triggered");

  // 1. Authentication Check: Ensure the user is authenticated.
  if (!context.auth) {
    logger.error("Authentication check failed: User is not authenticated.");
    throw new https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { companyId } = data;
  if (!companyId || typeof companyId !== "string") {
    logger.error("Invalid companyId provided.");
    throw new https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid companyId string."
    );
  }

  const userId = context.auth.uid;
  logger.info(`Attempting to delete company ${companyId} by user ${userId}`);

  const companyRef = db.collection("companies").doc(companyId);
  const userRef = db.collection("users").doc(userId);

  try {
    // 2. Authorization Check: Verify the user is the owner of the company.
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
      logger.error(`Company ${companyId} not found.`);
      throw new https.HttpsError("not-found", "Company not found.");
    }

    const companyData = companyDoc.data();
    if (companyData?.ownerId !== userId) {
      logger.error(
        `User ${userId} is not the owner of company ${companyId}.`
      );
      throw new https.HttpsError(
        "permission-denied",
        "You are not authorized to delete this company."
      );
    }

    logger.info(`User ${userId} authorized to delete company ${companyId}.`);

    // 3. Delete all sub-collections.
    const subCollections = [
      "accounts", "employees", "payrolls", "purchases",
      "sales", "subjects", "vouchers", "cost-centers", "fees",
    ];

    for (const subCollection of subCollections) {
      logger.info(`Deleting sub-collection: ${subCollection}`);
      const snapshot = await companyRef.collection(subCollection).get();
      if (snapshot.empty) {
        logger.info(`Sub-collection ${subCollection} is already empty.`);
        continue;
      }
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      logger.info(`Successfully deleted ${snapshot.size} documents from ${subCollection}.`);
    }

    // 4. Delete the main company document.
    logger.info(`Deleting main company document: ${companyId}`);
    await companyRef.delete();

    // 5. Update the user's document to remove the company ID.
    logger.info(`Removing company ${companyId} from user ${userId}'s companyIds.`);
    await userRef.update({
      companyIds: admin.firestore.FieldValue.arrayRemove(companyId),
    });

    logger.info(`Successfully deleted company ${companyId}.`);
    return { success: true, message: "Company deleted successfully." };
  } catch (error) {
    logger.error("Error deleting company:", error);
    if (error instanceof https.HttpsError) {
      throw error; // Re-throw HttpsError directly
    }
    throw new https.HttpsError(
      "internal",
      "An unexpected error occurred while deleting the company.",
      error
    );
  }
});
