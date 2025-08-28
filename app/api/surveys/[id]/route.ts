import { type NextRequest, NextResponse } from "next/server"
import { calculateSurveyPoints } from "@/lib/points"
import { serverFirestoreService } from "@/lib/firebase-admin"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params
    const survey = await serverFirestoreService.surveys.getById(surveyId)
    
    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
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
    const existingSurvey = await serverFirestoreService.surveys.getById(id)
    if (!existingSurvey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }
    
    // ポイント計算
    const points = calculateSurveyPoints(body.questions || [])

    // アンケートデータを更新
    const updates = {
      title: body.title,
      description: body.description || null,
      questions: body.questions || [],
      is_published: body.is_published !== undefined ? body.is_published : existingSurvey.is_published,
      respondent_points: points.respondentPoints,
      creator_points: points.creatorPoints
    }

    const updatedSurvey = await serverFirestoreService.surveys.update(id, updates)

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
    
    const result = await serverFirestoreService.surveys.delete(id)
    
    return NextResponse.json({ 
      message: "Survey deleted successfully",
      survey: result.survey,
      pointsReturned: result.pointsReturned
    })
  } catch (error) {
    console.error('Error deleting survey:', error)
    
    if (error instanceof Error && error.message === "Survey not found") {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: "Failed to delete survey",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}