import { type NextRequest, NextResponse } from "next/server"
import { isDeveloperAccount } from "@/lib/developer"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, doc, increment } from "firebase/firestore"
import { withAuth, createErrorResponse, validateOrigin, authenticateUser } from "@/lib/auth-middleware"
import { validateInput, SurveySchema, validateCanCreateSurvey } from "@/lib/validation"

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUnpublished = searchParams.get("include_unpublished") === "true"
    const creatorId = searchParams.get("creator_id")

    if (creatorId) {
      try {
        const user = await authenticateUser(request)
        if (user.uid !== creatorId) {
          return createErrorResponse("Unauthorized: Can only access own surveys", 403)
        }
      } catch {
        return createErrorResponse("Authentication required for user surveys", 401)
      }
    }

    let surveysQuery

    if (creatorId) {
      surveysQuery = query(collection(db, "surveys"), where("creator_id", "==", creatorId))
    } else if (!includeUnpublished) {
      surveysQuery = query(collection(db, "surveys"), where("is_published", "==", true))
    } else {
      surveysQuery = query(collection(db, "surveys"))
    }

    const snapshot = await getDocs(surveysQuery)
    const surveys = snapshot.docs
      .map((surveyDoc) => {
        const data = surveyDoc.data() as Record<string, any>
        const { expires_at, last_extended_at, expired_at, ...rest } = data

        return {
          id: surveyDoc.id,
          ...rest,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const response = NextResponse.json({ surveys })

    if (!creatorId && !includeUnpublished) {
      response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60")
    }

    return response
  } catch (error) {
    console.error("Error fetching surveys:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch surveys",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    if (!validateOrigin(request)) {
      console.error("Origin validation failed for request:", request.url, request.headers.get("origin"))
      return createErrorResponse("Invalid origin", 403)
    }

    const body = await request.json()
    const validatedData = validateInput(SurveySchema, body)

    const surveyData: Record<string, any> = {
      type: validatedData.type || "native",
      title: validatedData.title,
      description: validatedData.description || null,
      creator_id: user.uid,
      is_published: validatedData.is_published || false,
      response_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }

    if (validatedData.type === "native" || !validatedData.type) {
      surveyData.questions = validatedData.questions || []
    }

    if (validatedData.type === "google_form") {
      surveyData.google_form_url = validatedData.google_form_url
      surveyData.embedded_url = validatedData.embedded_url
      surveyData.estimated_time = validatedData.estimated_time
      surveyData.category = validatedData.category
      surveyData.target_audience = validatedData.target_audience || null
    }

    if (validatedData.is_published) {
      const isDevAccount = isDeveloperAccount(user.email!)

      if (!isDevAccount) {
        const usersQuery = query(collection(db, "users"), where("email", "==", user.email))
        const userSnapshot = await getDocs(usersQuery)

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0]
          const userData = userDoc.data()
          validateCanCreateSurvey(userData.surveys_answered || 0, userData.surveys_created || 0)

          await updateDoc(doc(db, "users", userDoc.id), {
            surveys_created: increment(1),
            updated_at: serverTimestamp(),
          })
        }
      }
    }

    const docRef = await addDoc(collection(db, "surveys"), surveyData)

    return NextResponse.json(
      {
        survey: {
          id: docRef.id,
          ...surveyData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating survey:", error)
    const message = error instanceof Error ? error.message : "Failed to create survey"
    return createErrorResponse(message, 500)
  }
})
