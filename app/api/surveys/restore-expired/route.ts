import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Survey expiry is disabled.",
    restored: 0,
    surveys: [],
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    count: 0,
    surveys: [],
  })
}
