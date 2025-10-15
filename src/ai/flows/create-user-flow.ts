
'use server';
/**
 * @fileOverview A flow to create a new user by an admin.
 * This flow now calls a dedicated API endpoint which would, in a real
 * scenario, be a secure Firebase Cloud Function using the Admin SDK.
 */

import { ai } from '@/ai/genkit';
import { 
    CreateUserInputSchema, 
    CreateUserOutputSchema,
    type CreateUserInput,
    type CreateUserOutput
} from './schemas';

export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}


const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    // In a real production app, you would secure this endpoint and use the 
    // Firebase Admin SDK inside the API route.
    // For now, this flow acts as a pass-through to the API endpoint.
    console.log(`[Flow] Calling /api/create-user for ${input.email}`);

    // This simulates calling a secure backend endpoint.
    // We assume the host is available, in a real app you'd use a full URL
    // from environment variables.
    const response = await fetch('http://localhost:9002/api/create-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[Flow] Error from API: ${errorBody}`);
        throw new Error(`Failed to create user. API responded with status ${response.status}.`);
    }

    const newUserProfile: CreateUserOutput = await response.json();
    console.log(`[Flow] Received successful response from API for UID: ${newUserProfile.uid}`);
    
    return newUserProfile;
  }
);
