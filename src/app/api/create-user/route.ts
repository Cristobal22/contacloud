
import { NextResponse } from 'next/server';
import type { CreateUserInput, CreateUserOutput } from '@/ai/flows/schemas';

/**
 * API route to simulate user creation.
 * In a real-world scenario, this would be a Firebase Cloud Function
 * using the Firebase Admin SDK to securely create a user.
 */
export async function POST(request: Request) {
  try {
    const body: CreateUserInput = await request.json();
    const { email, password, displayName } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // THIS IS A MOCK IMPLEMENTATION
    console.log(`[API Route] Simulating creation of auth user for: ${email}`);

    // 1. Simulate Auth User creation & get a fake UID
    const simulatedUid = `mock-uid-${Date.now()}`;
    console.log(`[API Route] Simulated UID: ${simulatedUid}`);

    // 2. Simulate creating the user profile object that would be saved to Firestore
    const newUserProfile: CreateUserOutput = {
      uid: simulatedUid,
      email: email,
      displayName: displayName || email.split('@')[0],
      role: 'Accountant', // All users created by Admin are Accountants
      photoURL: `https://i.pravatar.cc/150?u=${simulatedUid}` // A random avatar
    };

    console.log(`[API Route] Simulated user profile generation:`, newUserProfile);
    
    // NOTE: This does NOT create an actual Firebase Auth user OR a Firestore doc.
    // The user will NOT be able to log in. This is a placeholder to demonstrate the architecture.

    // Return the simulated user profile
    return NextResponse.json(newUserProfile, { status: 200 });

  } catch (error) {
    console.error('[API Route] Error processing request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
