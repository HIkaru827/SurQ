// Developer account utilities
const DEVELOPER_EMAILS = [
  'hikarujin167@gmail.com'
]

export function isDeveloperAccount(email: string): boolean {
  return DEVELOPER_EMAILS.includes(email.toLowerCase())
}

export const DEVELOPER_CONFIG = {
  UNLIMITED_POINTS: 999999,
  BYPASS_POINT_REQUIREMENTS: true
}