import { type NextRequest, NextResponse } from "next/server"

// 一時的なメモリ内ストレージ
let responses: any[] = []
let responseIdCounter = 1

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const surveyId = params.id
    const surveyResponses = responses.filter(response => response.survey_id === surveyId)
    
    return NextResponse.json({ responses: surveyResponses })
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const surveyId = params.id
    const body = await request.json()

    const responseData = {
      id: String(responseIdCounter++),
      survey_id: surveyId,
      respondent_id: 'anonymous-user',
      answers: body.answers,
      completed_at: new Date().toISOString()
    }

    // メモリに保存
    responses.push(responseData)

    return NextResponse.json({ 
      response: responseData
    }, { status: 201 })
  } catch (error) {
    console.error('Error submitting response:', error)
    return NextResponse.json({ 
      error: "Failed to submit response",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
