import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

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
    const surveyDoc = await getDoc(doc(db, "surveys", surveyId))

    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    const data = surveyDoc.data()
    const { expires_at, last_extended_at, expired_at, ...rest } = data

    const survey = {
      id: surveyDoc.id,
      ...rest,
      created_at: data?.created_at?.toDate?.()?.toISOString() || data?.created_at,
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || data?.updated_at,
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error fetching survey:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch survey",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const surveyDoc = await getDoc(doc(db, "surveys", id))
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    const updates = {
      title: body.title,
      description: body.description || null,
      questions: body.questions || [],
      is_published: body.is_published !== undefined ? body.is_published : surveyDoc.data()?.is_published,
      updated_at: serverTimestamp(),
    }

    await updateDoc(doc(db, "surveys", id), updates)

    return NextResponse.json({
      survey: {
        id,
        ...surveyDoc.data(),
        ...updates,
        updated_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating survey:", error)
    return NextResponse.json(
      {
        error: "Failed to update survey",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const surveyDoc = await getDoc(doc(db, "surveys", id))
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    const surveyData = surveyDoc.data()
    await deleteDoc(doc(db, "surveys", id))

    return NextResponse.json({
      message: "Survey deleted successfully",
      survey: { id, ...surveyData },
      postQuotaReturned: surveyData?.response_count === 0,
    })
  } catch (error) {
    console.error("Error deleting survey:", error)
    return NextResponse.json(
      {
        error: "Failed to delete survey",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
