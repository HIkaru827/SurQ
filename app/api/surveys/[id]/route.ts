import { type NextRequest, NextResponse } from "next/server"
import { calculateSurveyPoints } from "@/lib/points"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params
    const surveyDoc = await getDoc(doc(db, 'surveys', surveyId))
    
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    const survey = {
      id: surveyDoc.id,
      ...surveyDoc.data(),
      created_at: surveyDoc.data()?.created_at?.toDate?.()?.toISOString() || surveyDoc.data()?.created_at,
      updated_at: surveyDoc.data()?.updated_at?.toDate?.()?.toISOString() || surveyDoc.data()?.updated_at
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error('Error fetching survey:', error)
    return NextResponse.json({ 
      error: "Failed to fetch survey",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // 既存アンケートを確認
    const surveyDoc = await getDoc(doc(db, 'surveys', id))
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }
    
    // ポイント計算
    const points = calculateSurveyPoints(body.questions || [])

    // アンケートデータを更新
    const updates = {
      title: body.title,
      description: body.description || null,
      questions: body.questions || [],
      is_published: body.is_published !== undefined ? body.is_published : surveyDoc.data()?.is_published,
      respondent_points: points.respondentPoints,
      creator_points: points.creatorPoints,
      updated_at: serverTimestamp()
    }

    await updateDoc(doc(db, 'surveys', id), updates)

    // 更新されたドキュメントを取得して返す
    const updatedSurvey = {
      id,
      ...surveyDoc.data(),
      ...updates,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({ survey: updatedSurvey })
  } catch (error) {
    console.error('Error updating survey:', error)
    return NextResponse.json({ 
      error: "Failed to update survey",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const surveyDoc = await getDoc(doc(db, 'surveys', id))
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }
    
    const surveyData = surveyDoc.data()
    
    // ドキュメントを削除
    await deleteDoc(doc(db, 'surveys', id))
    
    return NextResponse.json({ 
      message: "Survey deleted successfully",
      survey: { id, ...surveyData },
      pointsReturned: surveyData?.response_count === 0 ? surveyData.creator_points : 0
    })
  } catch (error) {
    console.error('Error deleting survey:', error)
    return NextResponse.json({ 
      error: "Failed to delete survey",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}