
import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

// Securely initialize the Firebase Admin SDK only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = getFirestore();

export const getLatestPayrollSalary = onCall(async (request) => {
  // 1. Check for authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  // 2. Validate input data
  const { companyId, employeeId } = request.data;
  if (!companyId || !employeeId) {
    throw new HttpsError("invalid-argument", "Missing companyId or employeeId.");
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
    const suggestedValue = lastPayroll.baseIndemnizacion ?? lastPayroll.taxableEarnings ?? 0;

    // ALWAYS return the same shape
    return { baseIndemnizacion: suggestedValue };
  } catch (error) {
    console.error("Error fetching latest payroll for employee:", employeeId, "in company:", companyId, error);
    // Log the detailed error on the server, but throw a generic one to the client
    // This helps debugging without exposing implementation details.
    throw new HttpsError("internal", "An internal error occurred while fetching payroll data.");
  }
});
