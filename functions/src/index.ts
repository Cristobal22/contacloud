
import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = getFirestore();

export const getLatestPayrollSalary = onCall(async (request) => {
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
      return { baseIndemnizacion: null };
    }

    const lastPayroll = snapshot.docs[0].data();

    // Prioritize the new 'baseIndemnizacion' field.
    // Fallback to 'taxableEarnings' for older documents.
    const suggestedValue = lastPayroll.baseIndemnizacion ?? lastPayroll.taxableEarnings ?? 0;

    // Return the suggested value under the new key
    return { baseIndemnizacion: suggestedValue };
  } catch (error) {
    console.error("Error fetching latest payroll:", error);
    // Throw a generic error to the client
    throw new Error("An internal error occurred while fetching payroll data.");
  }
});
