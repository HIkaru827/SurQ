import { NextRequest, NextResponse } from 'next/server'
import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { DecodedIdToken } from 'firebase-admin/auth'

// Initialize Firebase Admin SDK
let adminApp
try {
  if (!getApps().length) {
    console.log('Initializing Firebase Admin with projectId:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)

    // Use service account credentials if available, otherwise fall back to default
    let adminConfig: any = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }

    // Check if we have service account environment variables
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('Using service account credentials from environment variables')
      adminConfig.credential = cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      })
    } else {
      console.log('Service account credentials not found, using default credentials')
      // For local development, Firebase Admin SDK will use Application Default Credentials
      // or the GOOGLE_APPLICATION_CREDENTIALS environment variable
    }

    adminApp = initializeApp(adminConfig, 'admin')
  } else {
    adminApp = getApps().find(app => app.name === 'admin') || getApps()[0]
  }
  console.log('Firebase Admin initialized successfully:', adminApp.name)
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
  adminApp = null
}

const adminAuth = adminApp ? getAuth(adminApp) : null

export interface AuthenticatedRequest extends NextRequest {
  user: DecodedIdToken
}

/**
 * Middleware to authenticate Firebase ID tokens
 */
export async function authenticateUser(request: NextRequest): Promise<DecodedIdToken> {
  console.log('=== Authentication Debug ===')
  console.log('AdminAuth available:', !!adminAuth)
  console.log('AdminApp available:', !!adminApp)
  
  if (!adminAuth) {
    console.error('Firebase Admin not initialized - adminAuth is null')
    throw new Error('Firebase Admin not initialized')
  }

  const authHeader = request.headers.get('Authorization')
  console.log('Auth header present:', !!authHeader)
  console.log('Auth header format valid:', authHeader?.startsWith('Bearer '))
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header')
  }

  const idToken = authHeader.substring(7) // Remove 'Bearer ' prefix
  console.log('ID token length:', idToken?.length)

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log('Token verified for user:', decodedToken.email)
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
  console.log('Admin check:', {
    userEmail: user.email,
    adminEmails: adminEmails,
    isAdmin: adminEmails.includes(user.email || '')
  })
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
      console.log('=== Admin Auth Flow ===')
      const user = await authenticateUser(request)
      console.log('User authenticated successfully:', user.email)

      const isAdmin = isAdminUser(user)
      console.log('Admin check result:', isAdmin)

      if (!isAdmin) {
        console.log('Admin access denied for user:', user.email)
        return NextResponse.json({
          error: 'Admin access required',
          debug: {
            userEmail: user.email,
            adminEmails: process.env.ADMIN_EMAILS?.split(',') || [],
            isAdmin: isAdmin
          }
        }, { status: 403 })
      }

      console.log('Admin access granted for user:', user.email)
      return await handler(request, user, ...args)
    } catch (error) {
      console.error('Admin auth error:', error)
      const message = error instanceof Error ? error.message : 'Authentication failed'
      return NextResponse.json({
        error: 'Authentication required',
        message,
        debug: {
          adminAuthAvailable: !!adminAuth,
          adminAppAvailable: !!adminApp
        }
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