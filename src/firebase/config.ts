

// This is a placeholder for the Firebase config object
// In a real application, this would be populated with your Firebase project's configuration

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!firebaseApiKey) {
    throw new Error("Missing Firebase API Key. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your .env.local file.");
}

export const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
