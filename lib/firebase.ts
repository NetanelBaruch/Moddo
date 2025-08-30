/**
 * Firebase Configuration and Initialization
 * 
 * This file initializes Firebase services for the Moddo MVP:
 * - Authentication: User sign-in/sign-up
 * - Firestore: Project data, concepts, feedback storage
 * - Storage: Image and 3D model file storage
 * - Functions: Server-side processing (AI generation, 3D conversion)
 * 
 * Business Context: Firebase provides the scalable backend infrastructure
 * needed to handle user projects, AI-generated content, and file storage
 * while maintaining security and performance for the MVP.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration - using environment variables for security
// These correspond to the 'digital-wall-ce229' project mentioned in user rules
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'digital-wall-ce229',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase - only if not already initialized
// This prevents multiple initialization errors in development
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Export Firebase services for use throughout the application
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Export the app instance for any additional configurations
export default app;
