import { NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp, getDoc, increment } from "firebase/firestore"
import { withAuth, createErrorResponse } from "@/lib/auth-middleware"
import { validateInput, EmailSchema } from "@/lib/validation"
import { createSurveyResponseNotification } from "@/lib/notifications"

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params
    const body = await request.json()
    const { responses, respondent_email, respondent_name } = body

    if (!responses || !respondent_email) {
      return NextResponse.json({ error: "回答データとメールアドレスが必要です" }, { status: 400 })
    }

    const surveyDoc = await getDoc(doc(db, "surveys", surveyId))
    if (!surveyDoc.exists()) {
      return NextResponse.json({ error: "アンケートが見つかりません" }, { status: 404 })
    }

    const surveyData = surveyDoc.data()

    const existingResponseQuery = query(
      collection(db, "survey_responses"),
      where("survey_id", "==", surveyId),
      where("respondent_email", "==", respondent_email)
    )
    const existingResponseSnapshot = await getDocs(existingResponseQuery)

    if (!existingResponseSnapshot.empty) {
      return NextResponse.json({ error: "このアンケートには既に回答済みです" }, { status: 400 })
    }

    await addDoc(collection(db, "survey_responses"), {
      survey_id: surveyId,
      survey_title: surveyData.title,
      survey_creator_id: surveyData.creator_id,
      respondent_email,
      respondent_name: respondent_name || "Anonymous",
      responses,
      submitted_at: serverTimestamp(),
      created_at: serverTimestamp(),
    })

    await updateDoc(doc(db, "surveys", surveyId), {
      response_count: (surveyData.response_count || 0) + 1,
      updated_at: serverTimestamp(),
    })

    const usersQuery = query(collection(db, "users"), where("email", "==", respondent_email))
    const userSnapshot = await getDocs(usersQuery)

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      await updateDoc(doc(db, "users", userDoc.id), {
        surveys_answered: increment(1),
        last_answered_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    } else {
      await addDoc(collection(db, "users"), {
        name: respondent_name || "Anonymous User",
        email: respondent_email,
        surveys_answered: 1,
        surveys_created: 0,
        last_answered_at: serverTimestamp(),
        badges: [],
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    }

    try {
      await createSurveyResponseNotification(
        surveyData.creator_id,
        surveyId,
        surveyData.title,
        respondent_name || "Anonymous",
        respondent_email,
        surveyData.respondent_points || 0
      )
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError)
    }

    return NextResponse.json({
      success: true,
      message: "回答が送信されました",
      points_earned: surveyData.respondent_points || 0,
    })
  } catch (error) {
    console.error("Error submitting survey response:", error)
    const message = error instanceof Error ? error.message : "回答の送信に失敗しました"
    return createErrorResponse(message, 500)
  }
}

export const GET = withAuth(async (
  request: NextRequest,
  user,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: surveyId } = await params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (email) {
      validateInput(EmailSchema, { email })

      if (user.email !== email) {
        return createErrorResponse("Unauthorized: Can only check own response status", 403)
      }

      const responseQuery = query(
        collection(db, "survey_responses"),
        where("survey_id", "==", surveyId),
        where("respondent_email", "==", email)
      )
      const responseSnapshot = await getDocs(responseQuery)

      return NextResponse.json({
        hasResponded: !responseSnapshot.empty,
        response: responseSnapshot.empty
          ? null
          : {
              id: responseSnapshot.docs[0].id,
              ...responseSnapshot.docs[0].data(),
            },
      })
    }

    const responsesQuery = query(
      collection(db, "survey_responses"),
      where("survey_id", "==", surveyId)
    )
    const responsesSnapshot = await getDocs(responsesQuery)

    const responses = responsesSnapshot.docs.map((responseDoc) => ({
      id: responseDoc.id,
      ...responseDoc.data(),
      submitted_at: responseDoc.data().submitted_at?.toDate?.()?.toISOString() || responseDoc.data().submitted_at,
    }))

    return NextResponse.json({ responses })
  } catch (error) {
    console.error("Error fetching survey responses:", error)
    const message = error instanceof Error ? error.message : "回答の取得に失敗しました"
    return createErrorResponse(message, 500)
  }
})
