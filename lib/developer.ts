// Developer account utilities
// Using environment variables for security instead of hardcoded emails
export function isDeveloperAccount(email: string): boolean {
  // Server-side check
  if (typeof window === 'undefined') {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
    return adminEmails.includes(email.toLowerCase())
  }
  
  // Client-side check - hardcode for development
  const devEmails = ['hikarujin167@gmail.com']
  return devEmails.includes(email.toLowerCase())
}

export const DEVELOPER_CONFIG = {
  UNLIMITED_POINTS: 999999,
  BYPASS_POINT_REQUIREMENTS: true
}