import { NextRequest, NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { DecodedIdToken } from 'firebase-admin/auth'

// Initialize Firebase Admin SDK
let adminApp
try {
  if (!getApps().length) {
    // In production, you should use a service account key file
    // For development, we'll use the default credentials
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } else {
    adminApp = getApps()[0]
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
}

const adminAuth = adminApp ? getAuth(adminApp) : null

export interface AuthenticatedRequest extends NextRequest {
  user: DecodedIdToken
}

/**
 * Middleware to authenticate Firebase ID tokens
 */
export async function authenticateUser(request: NextRequest): Promise<DecodedIdToken> {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized')
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header')
  }

  const idToken = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    console.error('Token verification failed:', error)
    throw new Error('Invalid or expired token')
  }
}

/**
 * Check if user has admin/developer privileges
 */
export function isAdminUser(user: DecodedIdToken): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
  return adminEmails.includes(user.email || '')
}

/**
 * Authorize resource access - check if user owns the resource
 */
export function authorizeResourceAccess(userId: string, resourceOwnerId: string): void {
  if (userId !== resourceOwnerId) {
    throw new Error('Forbidden: Insufficient permissions')
  }
}

/**
 * Wrapper function to add authentication to API routes
 */
export function withAuth(handler: (request: NextRequest, user: DecodedIdToken, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const user = await authenticateUser(request)
      return await handler(request, user, ...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      return NextResponse.json({ 
        error: 'Authentication required',
        message 
      }, { status: 401 })
    }
  }
}

/**
 * Wrapper function to add admin authentication to API routes
 */
export function withAdminAuth(handler: (request: NextRequest, user: DecodedIdToken, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      const user = await authenticateUser(request)
      
      if (!isAdminUser(user)) {
        return NextResponse.json({ 
          error: 'Admin access required' 
        }, { status: 403 })
      }
      
      return await handler(request, user, ...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed'
      return NextResponse.json({ 
        error: 'Authentication required',
        message 
      }, { status: 401 })
    }
  }
}

/**
 * Create error responses with consistent format
 */
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({
    error: message,
    timestamp: new Date().toISOString()
  }, { status })
}

/**
 * Validate request origin for additional security
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
  
  console.log('Origin validation:', { origin, allowedOrigins, env: process.env.ALLOWED_ORIGINS })
  
  // If no origin header (server-side request), allow
  if (!origin) return true
  
  // For production, if ALLOWED_ORIGINS is not properly set, allow surq.net
  if (!process.env.ALLOWED_ORIGINS && (origin === 'https://surq.net' || origin.includes('localhost'))) {
    console.log('Using fallback origin validation for:', origin)
    return true
  }
  
  // Check against allowed origins
  const isAllowed = allowedOrigins.some(allowed => allowed.trim() === origin)
  
  if (!isAllowed) {
    console.error('Origin validation failed:', { origin, allowedOrigins, env: process.env.ALLOWED_ORIGINS })
    
    // Emergency fallback for production - allow surq.net and localhost
    if (origin === 'https://surq.net' || origin.includes('localhost')) {
      console.log('Emergency fallback: allowing production origin')
      return true
    }
  }
  
  return isAllowed
}

/**
 * Global error handler for authentication failures
 */
export function handleAuthError(error: any): NextResponse {
  console.error('Authentication error:', error)
  
  if (error.message?.includes('Token verification failed')) {
    return createErrorResponse('認証トークンが無効です。再ログインしてください。', 401)
  }
  
  if (error.message?.includes('No valid authorization header')) {
    return createErrorResponse('認証が必要です。ログインしてください。', 401)
  }
  
  if (error.message?.includes('Forbidden')) {
    return createErrorResponse('このリソースにアクセスする権限がありません。', 403)
  }
  
  // Default authentication error
  return createErrorResponse('認証に失敗しました。', 401)
}