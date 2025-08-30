import { initializeApp, FirebaseApp, getApps } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Debug: Check if config is properly loaded (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Firebase config validation:', {
    apiKey: firebaseConfig.apiKey ? 'CONFIGURED' : 'MISSING',
    authDomain: firebaseConfig.authDomain ? 'CONFIGURED' : 'MISSING',
    projectId: firebaseConfig.projectId ? 'CONFIGURED' : 'MISSING',
    environment: process.env.NODE_ENV
  })
  
  // Check if any config values are missing
  const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key)
  
  if (missingKeys.length > 0) {
    console.error('Missing Firebase config keys:', missingKeys)
  }
}

// Initialize Firebase (avoid multiple initialization)
let app: FirebaseApp
let auth: Auth | undefined
let db: Firestore | undefined  
let storage: FirebaseStorage | undefined

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  // Validate config before initializing
  const requiredKeys = ['apiKey', 'authDomain', 'projectId']
  const missingRequired = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])
  
  if (missingRequired.length > 0) {
    console.error('Cannot initialize Firebase - missing required config:', missingRequired)
    // Don't initialize Firebase if critical config is missing
  } else {
    // Check if Firebase is already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
    
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  }
} else {
  // Server side - create empty app reference
  app = {} as FirebaseApp
}

export { app, auth, db, storage }

// Database interfaces matching the original Supabase schema
export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
  points: number
  level: number
  badges: any[]
  created_at: string
  updated_at: string
}

export interface Survey {
  id: string
  title: string
  description: string | null
  creator_id: string
  questions: any
  is_published: boolean
  response_count: number
  respondent_points: number
  creator_points: number
  created_at: string
  updated_at: string
}

export interface SurveyResponse {
  id: string
  survey_id: string
  respondent_id: string | null
  answers: any
  completed_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_type: string
  achievement_data: any
  earned_at: string
}