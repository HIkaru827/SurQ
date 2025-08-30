// Developer account utilities
// Using environment variables for security instead of hardcoded emails
export function isDeveloperAccount(email: string): boolean {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

export const DEVELOPER_CONFIG = {
  UNLIMITED_POINTS: 999999,
  BYPASS_POINT_REQUIREMENTS: true
}