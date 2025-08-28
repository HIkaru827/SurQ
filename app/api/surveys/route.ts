import { type NextRequest, NextResponse } from "next/server"
import { calculateSurveyPoints } from "@/lib/points"
import { serverFirestoreService } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeUnpublished = searchParams.get('include_unpublished') === 'true'
    const creatorId = searchParams.get('creator_id')
    
    let surveys
    
    if (creatorId) {
      // 特定のユーザーのアンケートのみ（公開・未公開問わず）
      surveys = await serverFirestoreService.surveys.getUserSurveys(creatorId)
    } else {
      // 公開されたアンケートのみを返す（デフォルト）
      surveys = await serverFirestoreService.surveys.getPublished()
    }
    
    return NextResponse.json({ surveys })
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json({ 
      error: "Failed to fetch surveys",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // ポイント計算
    const points = calculateSurveyPoints(body.questions || [])

    const surveyData = {
      title: body.title,
      description: body.description || null,
      creator_id: body.creator_id || 'anonymous-user',
      questions: body.questions || [],
      is_published: body.is_published || false,
      respondent_points: points.respondentPoints,
      creator_points: points.creatorPoints
    }

    // Firestoreに保存
    const newSurvey = await serverFirestoreService.surveys.create(surveyData)

    return NextResponse.json({ survey: newSurvey }, { status: 201 })
  } catch (error) {
    console.error('Error creating survey:', error)
    return NextResponse.json({ 
      error: "Failed to create survey",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
