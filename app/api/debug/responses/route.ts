import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs } from "firebase/firestore"

// Firebase client config for server-side usage
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase for server-side API routes
let app
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

const db = getFirestore(app)

export async function GET(request: NextRequest) {
  try {
    const snapshot = await getDocs(collection(db, 'survey_responses'))
    const responses = snapshot.docs.map(doc => ({
      id: doc.id,
      survey_id: doc.data().survey_id,
      survey_title: doc.data().survey_title,
      respondent_email: doc.data().respondent_email,
      respondent_name: doc.data().respondent_name,
      points_earned: doc.data().points_earned,
      submitted_at: doc.data().submitted_at?.toDate?.()?.toISOString() || doc.data().submitted_at
    }))
    
    return NextResponse.json({ responses })
  } catch (error) {
    console.error('Error fetching all responses:', error)
    return NextResponse.json({ 
      error: "Failed to fetch responses",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}