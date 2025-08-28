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

// Initialize Firebase (avoid multiple initialization)
let app: FirebaseApp
let auth: Auth | undefined
let db: Firestore | undefined  
let storage: FirebaseStorage | undefined

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  // Check if Firebase is already initialized
  if (!getApps().length) {
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]
  }
  
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
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