import { z } from 'zod'

// User validation schemas
export const UserSchema = z.object({
  email: z.string().email('無効なメールアドレスです'),
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
  // points: z.number().int().min(0).optional().default(0) // 廃止
})

// Question validation schema
export const QuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['multiple-choice', 'text', 'rating', 'yes-no'], {
    errorMap: () => ({ message: '無効な質問タイプです' })
  }),
  question: z.string().min(1, '質問文は必須です').max(500, '質問文は500文字以内で入力してください'),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  allowOther: z.boolean().optional().default(false),
  allowMultiple: z.boolean().optional().default(false)
})

// Survey validation schema
export const SurveySchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional().nullable(),
  questions: z.array(QuestionSchema).max(50, '質問は50個以内で作成してください'),
  // respondent_points: z.number().min(0).max(1000, '回答者ポイントは1000以下である必要があります').optional().default(0), // 廃止
  // creator_points: z.number().min(0).optional().default(0), // 廃止
  is_published: z.boolean().optional().default(false)
}).refine((data) => {
  // 公開時は質問が必須、下書き時は不要
  return !data.is_published || data.questions.length > 0
}, {
  message: '公開するには質問が少なくとも1つ必要です',
  path: ['questions']
})

// Survey update schema (for partial updates)
export const SurveyUpdateSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください').optional(),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional().nullable(),
  questions: z.array(QuestionSchema).max(50, '質問は50個以内で作成してください').optional(),
  // respondent_points: z.number().min(0).max(1000, '回答者ポイントは1000以下である必要があります').optional(), // 廃止
  // creator_points: z.number().min(0).optional(), // 廃止
  is_published: z.boolean().optional()
})

// Response validation schema
export const ResponseSchema = z.object({
  survey_id: z.string().min(1, 'アンケートIDは必須です'),
  user_email: z.string().email('無効なメールアドレスです'),
  answers: z.record(z.string(), z.any()).refine(
    (answers) => Object.keys(answers).length > 0,
    { message: '少なくとも1つの回答が必要です' }
  )
})

// Coupon validation schema
export const CouponSchema = z.object({
  email: z.string().email('無効なメールアドレスです'),
  couponCode: z.string().min(1, 'クーポンコードは必須です').max(50, 'クーポンコードは50文字以内で入力してください').regex(
    /^[A-Z0-9]+$/,
    'クーポンコードは英数字（大文字）のみ使用できます'
  )
})

// Email validation
export const EmailSchema = z.object({
  email: z.string().email('無効なメールアドレスです')
})

// ID validation
export const IdSchema = z.object({
  id: z.string().min(1, 'IDは必須です')
})

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

// Query parameters validation
export const QueryParamsSchema = z.object({
  email: z.string().email().optional(),
  creator_id: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
})

/**
 * Validate and sanitize input data
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`入力検証エラー: ${messages.join(', ')}`)
    }
    throw new Error('入力データが無効です')
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000) // Limit length
}

/**
 * Validate survey ownership
 */
export function validateSurveyOwnership(userEmail: string, surveyCreatorId: string): void {
  if (userEmail !== surveyCreatorId) {
    throw new Error('このアンケートを編集する権限がありません')
  }
}

/**
 * Validate sufficient posts for survey creation
 * 投稿権があるかチェック（4回答 = 1投稿権）
 */
export function validateCanCreateSurvey(surveys_answered: number, surveys_created: number): void {
  const availablePosts = Math.floor(surveys_answered / 4) - surveys_created
  if (availablePosts <= 0) {
    const answersNeeded = 4 - (surveys_answered % 4)
    throw new Error(`投稿権が不足しています。あと${answersNeeded}回アンケートに回答すると投稿できます。`)
  }
}