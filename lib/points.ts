// 回答数ベースのアンケート投稿制度
// 4回答 = 1投稿権

export type QuestionType = "multiple-choice" | "rating" | "text" | "yes-no"

export interface Question {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  required?: boolean
  allowOther?: boolean
  allowMultiple?: boolean
}

// ===== アンケート有効期限システム =====
/**
 * アンケートの有効期限を計算する（作成日から1か月）
 * @param createdAt 作成日時
 * @returns 有効期限
 */
export function calculateExpiryDate(createdAt: Date): Date {
  const expiryDate = new Date(createdAt)
  expiryDate.setMonth(expiryDate.getMonth() + 1)
  return expiryDate
}

/**
 * 有効期限を延長する（現在日から1か月）
 * @param currentExpiry 現在の有効期限
 * @returns 延長後の有効期限
 */
export function extendExpiryDate(currentExpiry: Date): Date {
  const now = new Date()
  const extended = new Date(Math.max(currentExpiry.getTime(), now.getTime()))
  extended.setMonth(extended.getMonth() + 1)
  return extended
}

/**
 * アンケートが有効期限切れかチェック
 * @param expiryDate 有効期限
 * @returns 期限切れかどうか
 */
export function isExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}

/**
 * 有効期限までの残り日数を計算
 * @param expiryDate 有効期限
 * @returns 残り日数
 */
export function daysUntilExpiry(expiryDate: Date): number {
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * 有効期限が近づいているか（7日以内）
 * @param expiryDate 有効期限
 * @returns 近づいているかどうか
 */
export function isExpiryApproaching(expiryDate: Date): boolean {
  const days = daysUntilExpiry(expiryDate)
  return days <= 7 && days > 0
}

/**
 * ユーザーが今月アンケートに回答したかチェック
 * @param lastAnsweredAt 最後に回答した日時
 * @returns 今月回答したかどうか
 */
export function hasAnsweredThisMonth(lastAnsweredAt: Date | null): boolean {
  if (!lastAnsweredAt) return false
  
  const now = new Date()
  const lastAnswered = new Date(lastAnsweredAt)
  
  return (
    now.getFullYear() === lastAnswered.getFullYear() &&
    now.getMonth() === lastAnswered.getMonth()
  )
}

/**
 * ユーザーがアンケートを投稿できるかチェックする
 * @param surveys_answered 回答したアンケート総数
 * @param surveys_created 投稿したアンケート総数
 * @returns 投稿可能かどうか
 */
export function canCreateSurvey(surveys_answered: number, surveys_created: number): boolean {
  return Math.floor(surveys_answered / 4) > surveys_created
}

/**
 * 投稿可能回数を計算する
 * @param surveys_answered 回答したアンケート総数
 * @param surveys_created 投稿したアンケート総数
 * @returns 投稿可能回数
 */
export function calculateAvailablePosts(surveys_answered: number, surveys_created: number): number {
  return Math.max(0, Math.floor(surveys_answered / 4) - surveys_created)
}

/**
 * 次の投稿権を獲得するために必要な回答数を計算
 * @param surveys_answered 回答したアンケート総数
 * @returns 次の投稿権まであと何回答が必要か
 */
export function answersUntilNextPost(surveys_answered: number): number {
  return 4 - (surveys_answered % 4)
}

/**
 * 質問タイプから表示名を取得する
 */
export function getQuestionTypeLabel(type: QuestionType): string {
  const labels = {
    "yes-no": "はい/いいえ",
    "rating": "1〜5評価", 
    "multiple-choice": "複数選択肢",
    "text": "自由記述"
  }
  return labels[type]
}
