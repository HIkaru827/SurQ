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
  // points: number // 廃止 - 回答数ベースのシステムに移行
  level: number
  badges: any[]
  surveys_created: number
  surveys_answered: number
  total_responses_received: number
  created_at: string
  updated_at: string
}

/**
 * 投稿可能回数を計算する
 * @param surveys_answered 回答したアンケート総数
 * @param surveys_created 投稿したアンケート総数
 * @returns 投稿可能回数
 */
export function calculateAvailablePosts(surveys_answered: number, surveys_created: number): number {
  return Math.max(0, Math.floor(surveys_answered / 4) - surveys_created)
}

export interface Survey {
  id: string
  type: 'native' | 'google_form' // アンケート形式
  title: string
  description: string | null
  creator_id: string
  
  // ネイティブ形式用
  questions?: any
  
  // Googleフォーム形式用
  google_form_url?: string
  embedded_url?: string
  estimated_time?: number // 所要時間（分）
  category?: string
  target_audience?: string
  
  is_published: boolean
  response_count: number
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

// Googleフォーム回答追跡
export interface GoogleFormResponse {
  id: string
  survey_id: string
  user_id: string
  user_name: string
  user_email: string
  last_opened_at: string // 最後に「回答する」をクリックした時刻
  completed_at: string // 「回答しました」をクリックした時刻
  open_count: number // 「回答する」を押した回数
  estimated_duration_minutes: number // 所要時間（参考値）
  is_reported: boolean
  created_at: string
}

// 通報
export interface Report {
  id: string
  survey_id: string
  survey_title: string
  reporter_id: string
  reporter_name: string
  reported_user_id: string
  reported_user_name: string
  reason: string
  details: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  admin_notes?: string
  response_data?: {
    last_opened_at: string
    completed_at: string
    estimated_duration_minutes: number
  }
  created_at: string
  updated_at: string
}