// ポイント制度の計算ロジック

export type QuestionType = "multiple-choice" | "rating" | "text" | "yes-no"

export interface PointRates {
  respondent: number
  creator: number
}

export const POINT_RATES: Record<QuestionType, PointRates> = {
  "yes-no": { respondent: 0.5, creator: 1 },
  "rating": { respondent: 1.0, creator: 2 },
  "multiple-choice": { respondent: 1.0, creator: 2.5 },
  "text": { respondent: 1.5, creator: 5 }
} as const

export interface PointCalculation {
  respondentPoints: number
  creatorPoints: number
}

export interface Question {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  required: boolean
}

/**
 * アンケートの質問からポイントを計算する
 */
export function calculateSurveyPoints(questions: Question[]): PointCalculation {
  const totalRespondentPoints = questions.reduce((sum, question) => {
    return sum + POINT_RATES[question.type].respondent
  }, 0)
  
  const totalCreatorPoints = questions.reduce((sum, question) => {
    return sum + POINT_RATES[question.type].creator
  }, 0)
  
  return {
    respondentPoints: Math.round(totalRespondentPoints * 10) / 10,
    creatorPoints: Math.round(totalCreatorPoints * 10) / 10
  }
}

/**
 * ユーザーのポイントを更新する
 */
export function updateUserPoints(currentPoints: number, pointsToAdd: number): number {
  return Math.max(0, currentPoints + pointsToAdd)
}

/**
 * ユーザーがアンケートを投稿できるかチェックする
 */
export function canCreateSurvey(userPoints: number, requiredPoints: number): boolean {
  return userPoints >= requiredPoints
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

/**
 * 質問タイプの説明を取得する
 */
export function getQuestionTypeDescription(type: QuestionType): string {
  const rates = POINT_RATES[type]
  return `回答者：${rates.respondent}pt / 投稿者：${rates.creator}pt`
}