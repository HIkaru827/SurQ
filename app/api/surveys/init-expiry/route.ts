import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Survey expiry is disabled.",
    total: 0,
    updated: 0,
    skipped: 0,
    surveys: [],
  })
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    total: 0,
    withExpiry: 0,
    withoutExpiry: 0,
    needsUpdate: false,
    surveysWithoutExpiry: [],
  })
}
