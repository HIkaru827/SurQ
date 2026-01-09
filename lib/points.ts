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
