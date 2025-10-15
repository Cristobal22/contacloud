
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserProfile } from '@/lib/types';


// This is a temporary solution for service account credentials.
// In a real production environment, you should use environment variables
// or a secret manager.
const serviceAccount = process.env.SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.SERVICE_ACCOUNT_KEY)
  : undefined;

if (!getApps().length) {
    initializeApp({
        credential: serviceAccount ? cert(serviceAccount) : undefined,
    });
}

const auth = getAuth();
const firestore = getFirestore();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, displayName } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
        }

        // Step 1: Create the auth user
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: displayName || email.split('@')[0],
        });

        // Step 2: Create the user profile in Firestore
        const newUserProfile: UserProfile = {
            uid: userRecord.uid,
            email: email,
            displayName: displayName || email.split('@')[0],
            role: 'Accountant', // All users created by an admin are Accountants
            photoURL: `https://i.pravatar.cc/150?u=${userRecord.uid}`
        };

        await firestore.collection('users').doc(userRecord.uid).set(newUserProfile);

        return NextResponse.json({ uid: userRecord.uid, email: userRecord.email }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating user:', error);
        const errorMessage = error.code === 'auth/email-already-exists'
            ? 'El correo electrónico ya está en uso.'
            : 'Ocurrió un error inesperado al crear el usuario.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
