import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
let adminApp
try {
  if (!getApps().length) {
    // In production, you should use a service account key file
    // For development, we'll use the default credentials
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } else {
    adminApp = getApps()[0]
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
}

export const adminDb = adminApp ? getFirestore(adminApp) : null

if (!adminDb) {
  throw new Error('Firebase Admin not initialized')
}