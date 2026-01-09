"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { isDeveloperAccount } from "@/lib/developer"
import { authenticatedFetch } from "@/lib/api-client"
import { surveyEvents } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Send,
  MessageSquare,
  Star,
  CheckSquare,
  Type,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  canCreateSurvey,
  calculateAvailablePosts,
  answersUntilNextPost,
  getQuestionTypeLabel, 
  QuestionType,
  Question
} from "@/lib/points"

interface Survey {
  title: string
  description: string
  questions: Question[]
}

// interface PointCalculation { // 廃止
//   respondentPoints: number
//   creatorPoints: number
// }



const questionTemplates = [
  {
    type: "yes-no" as QuestionType,
    icon: MessageSquare,
    label: "はい/いいえ",
    description: "シンプルな二択質問",
    template: {
      question: "質問を入力してください",
      options: ["はい", "いいえ"],
      required: true,
    },
  },
  {
    type: "rating" as QuestionType,
    icon: Star,
    label: "1〜5評価",
    description: "満足度などの評価",
    template: {
      question: "満足度を教えてください",
      required: true,
    },
  },
  {
    type: "multiple-choice" as QuestionType,
    icon: CheckSquare,
    label: "複数選択肢",
    description: "複数の選択肢から選択",
    template: {
      question: "質問を入力してください",
      options: ["選択肢1", "選択肢2", "選択肢3"],
      required: true,
    },
  },
  {
    type: "text" as QuestionType,
    icon: Type,
    label: "自由記述",
    description: "自由な意見を記入",
    template: {
      question: "ご意見をお聞かせください",
      required: false,
    },
  },
]

function CreateSurveyPageInner() {
  const { user, userProfile } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const editSurveyId = searchParams.get('edit')
  
  const [survey, setSurvey] = useState<Survey>({
    title: "",
    description: "",
    questions: [],
  })
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [originalSurvey, setOriginalSurvey] = useState<any>(null)

  // const pointCalculation = calculateSurveyPoints(survey.questions) // 廃止
  // const userPoints = userProfile?.points || 0 // 廃止
  const isDevAccount = user?.email ? isDeveloperAccount(user.email) : false
  const surveys_answered = userProfile?.surveys_answered || 0
  const surveys_created = userProfile?.surveys_created || 0
  const availablePosts = calculateAvailablePosts(surveys_answered, surveys_created)
  const canPost = isDevAccount || canCreateSurvey(surveys_answered, surveys_created)
  
  
  // 編集モード時のデータ読み込み
  useEffect(() => {
    if (editSurveyId && user) {
      loadSurveyForEdit(editSurveyId)
    }
  }, [editSurveyId, user])
  
  const loadSurveyForEdit = async (surveyId: string) => {
    setIsLoading(true)
    try {
      const response = await authenticatedFetch(`/api/surveys?creator_id=${user?.uid}&include_unpublished=true`)
      if (response.ok) {
        const data = await response.json()
        const surveyToEdit = data.surveys.find((s: any) => s.id === surveyId)
        
        if (surveyToEdit) {
          setOriginalSurvey(surveyToEdit)
          setSurvey({
            title: surveyToEdit.title,
            description: surveyToEdit.description || "",
            questions: surveyToEdit.questions || []
          })
        } else {
          alert('アンケートが見つかりませんでした')
          window.location.href = '/app'
        }
      }
    } catch (error) {
      console.error('Error loading survey for edit:', error)
      alert('アンケートの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // アンケート公開処理
  const handleSaveDraft = async () => {
    // バリデーション（下書きの場合は緩い条件）
    if (!survey.title.trim()) {
      alert('アンケートタイトルを入力してください')
      return
    }

    const creatorId = user?.uid || 'anonymous-user'

    setIsSavingDraft(true)
    try {
      const url = editSurveyId ? `/api/surveys/${editSurveyId}` : '/api/surveys'
      const method = editSurveyId ? 'PUT' : 'POST'
      
      const response = await authenticatedFetch(url, {
        method: method,
        body: JSON.stringify({
          ...survey,
          creator_id: creatorId,
          creator_email: user?.email,
          is_published: false, // 下書きとして保存
          // respondent_points: pointCalculation.respondentPoints, // 廃止
          // creator_points: pointCalculation.creatorPoints // 廃止
        })
      })

      if (response.ok) {
        const data = await response.json()
        const surveyId = data.survey?.id || 'unknown'
        surveyEvents.saveDraft(surveyId)
        alert('下書きとして保存しました')
        
        // 新規作成の場合は編集モードに切り替え
        if (!editSurveyId && data.survey?.id) {
          window.location.href = `/survey/create?edit=${data.survey.id}`
        }
      } else {
        const error = await response.json()
        alert(`保存に失敗しました: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('下書きの保存中にエラーが発生しました')
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handlePublish = async () => {
    // バリデーション
    if (!survey.title.trim()) {
      if (confirm('アンケートタイトルを入力してください')) {
        return
      }
      return
    }

    if (survey.questions.length === 0) {
      if (confirm('質問を少なくとも1つ追加してください')) {
        return
      }
      return
    }

    // 投稿権チェック（開発者アカウントはスキップ）
    if (!canPost && !isDevAccount) {
      const answersNeeded = answersUntilNextPost(surveys_answered)
      if (confirm(`投稿権が不足しています。あと${answersNeeded}回アンケートに回答すると投稿できます。\n\n現在の回答数: ${surveys_answered}\n投稿可能回数: ${availablePosts}`)) {
        router.push('/app')
        return
      }
      return
    }

    // 質問のバリデーション
    for (let i = 0; i < survey.questions.length; i++) {
      const question = survey.questions[i]
      if (!question.question.trim()) {
        if (confirm(`質問 ${i + 1} の質問文を入力してください`)) {
          return
        }
        return
      }

      if ((question.type === 'multiple-choice' || question.type === 'yes-no') &&
          (!question.options || question.options.some(opt => !opt.trim()))) {
        if (confirm(`質問 ${i + 1} の選択肢を正しく入力してください`)) {
          return
        }
        return
      }
    }

    // 現在のユーザー情報を取得（Firebase認証から）
    const creatorId = user?.uid || 'anonymous-user'

    setIsPublishing(true)
    console.log('=== Publishing Survey Debug ===')
    console.log('User:', user?.email)
    console.log('Survey data:', survey)
    console.log('Available posts:', availablePosts)
    console.log('Device info:', {
      userAgent: navigator.userAgent,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    })

    try {
      const url = editSurveyId ? `/api/surveys/${editSurveyId}` : '/api/surveys'
      const method = editSurveyId ? 'PUT' : 'POST'

      const requestData = {
        ...survey,
        creator_id: creatorId,
        creator_email: user?.email,
        is_published: true,
        // respondent_points: pointCalculation.respondentPoints, // 廃止
        // creator_points: pointCalculation.creatorPoints // 廃止
      }

      console.log('API Request:', { url, method, requestData })

      const response = await authenticatedFetch(url, {
        method: method,
        body: JSON.stringify(requestData)
      })

      console.log('API Response status:', response.status)
      console.log('API Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', response.status, response.statusText, errorData)
        throw new Error('アンケートの公開に失敗しました')
      }

      const result = await response.json()
      const surveyId = result.survey?.id || editSurveyId || 'unknown'
      const questionTypes = survey.questions.map(q => q.type)
      const surveyType = questionTypes.length > 3 ? 'complex' : 'simple'
      
      surveyEvents.createSurvey(surveyId, surveyType)
      surveyEvents.publishSurvey(surveyId)

      // 成功メッセージを表示してからリダイレクト
      if (confirm('アンケートが公開されました！')) {
        // Next.js Routerを使用してリダイレクト
        router.push('/app')
      } else {
        router.push('/app')
      }

    } catch (error) {
      console.error('Error publishing survey:', error)
      if (confirm('アンケートの公開に失敗しました。もう一度お試しください。')) {
        // エラー時もconfirmで対応
      }
    } finally {
      setIsPublishing(false)
    }
  }

  const addQuestion = (type: QuestionType) => {
    // 質問数の上限チェック

    const template = questionTemplates.find((t) => t.type === type)
    if (!template) return

    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      ...template.template,
    }

    setSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    }))
  }

  const deleteQuestion = (id: string) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }))
  }

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setSurvey((prev) => {
      const newQuestions = [...prev.questions]
      const [removed] = newQuestions.splice(fromIndex, 1)
      newQuestions.splice(toIndex, 0, removed)
      return { ...prev, questions: newQuestions }
    })
  }

  const handleDragStart = (e: React.DragEvent, questionId: string) => {
    setDraggedItem(questionId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedItem) return

    const fromIndex = survey.questions.findIndex((q) => q.id === draggedItem)
    const toIndex = survey.questions.findIndex((q) => q.id === targetId)

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      moveQuestion(fromIndex, toIndex)
    }

    setDraggedItem(null)
  }

  const addOption = (questionId: string) => {
    const question = survey.questions.find((q) => q.id === questionId)
    if (!question || !question.options) return

    updateQuestion(questionId, {
      options: [...question.options, `選択肢${question.options.length + 1}`],
    })
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = survey.questions.find((q) => q.id === questionId)
    if (!question || !question.options) return

    const newOptions = [...question.options]
    newOptions[optionIndex] = value
    updateQuestion(questionId, { options: newOptions })
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = survey.questions.find((q) => q.id === questionId)
    if (!question || !question.options || question.options.length <= 2) return

    const newOptions = question.options.filter((_, index) => index !== optionIndex)
    updateQuestion(questionId, { options: newOptions })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">アンケートを読み込み中...</p>
        </div>
      </div>
    )
  }
  
  if (showPreview) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                編集に戻る
              </Button>
              <h1 className="font-semibold text-foreground">プレビュー</h1>
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{survey.title || "無題のアンケート"}</CardTitle>
              {survey.description && <p className="text-muted-foreground">{survey.description}</p>}
            </CardHeader>
            <CardContent className="space-y-8">
              {survey.questions.map((question, index) => (
                <div key={question.id} className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Badge variant="outline" className="mt-1">
                      {index + 1}
                    </Badge>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground mb-3">
                        {question.question}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </h3>

                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-border rounded-full" />
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "rating" && (
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <div key={rating} className="flex flex-col items-center space-y-1">
                              <div className="w-6 h-6 border-2 border-border rounded-full" />
                              <span className="text-sm">{rating}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "text" && (
                        <div className="w-full h-24 border-2 border-border rounded-md bg-muted/30" />
                      )}

                      {question.type === "yes-no" && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-border rounded-full" />
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < survey.questions.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="p-2 sm:px-3">
              <Link href="/app">
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline text-sm">戻る</span>
              </Link>
            </Button>
            <div className="flex items-center space-x-1 sm:space-x-3 flex-1 justify-center">
              <h1 className="font-semibold text-foreground text-sm sm:text-base">{editSurveyId ? 'アンケート編集' : 'アンケート作成'}</h1>
              {user && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium text-xs sm:text-sm px-2 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  {isDevAccount ? '∞回投稿可能' : `投稿可能: ${availablePosts}回`}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="p-2 sm:px-3">
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline text-sm">プレビュー</span>
              </Button>
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleSaveDraft}
                disabled={isSavingDraft || !survey.title.trim()}
                className="p-2 sm:px-3"
              >
                {isSavingDraft ? (
                  <span className="text-sm">保存中...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">下書き保存</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  if (!isPublishing && survey.questions.length > 0 && survey.title.trim() && (canPost || isDevAccount)) {
                    handlePublish()
                  }
                }}
                disabled={isPublishing || survey.questions.length === 0 || !survey.title.trim() || (!canPost && !isDevAccount)}
                className={`p-2 sm:px-3 ${!canPost && !isDevAccount ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isPublishing ? (
                  <span className="text-sm">公開中...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">公開</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Basic Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Survey Info */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">アンケートタイトル</Label>
                  <Input
                    id="title"
                    placeholder="アンケートのタイトルを入力"
                    value={survey.title}
                    onChange={(e) => setSurvey((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明（任意）</Label>
                  <Textarea
                    id="description"
                    placeholder="アンケートの説明を入力"
                    value={survey.description}
                    onChange={(e) => setSurvey((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-6">

            {/* Point Calculation Display */}
            <Card className={`border-2 ${!canPost && !isDevAccount ? 'border-red-200 bg-red-50/30' : 'border-primary/20 bg-primary/5'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  ポイント計算
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {isDevAccount ? '∞' : availablePosts}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        投稿可能回数
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{survey.questions.length}</div>
                      <div className="text-sm text-muted-foreground">質問数</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{surveys_answered}</div>
                      <div className="text-sm text-muted-foreground">回答数</div>
                    </div>
                  </Card>
                </div>
                
                {!canPost && !isDevAccount && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                    ⚠️ 投稿権が不足しています。あと{answersUntilNextPost(surveys_answered)}回答すると投稿できます。
                  </div>
                )}
                
                
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">質問 ({survey.questions.length})</h2>
                {survey.questions.length === 0 && (
                  <p className="text-muted-foreground text-sm">質問を追加するには下のテンプレートをクリックしてください</p>
                )}
              </div>

              {survey.questions.map((question, index) => (
                <Card
                  key={question.id}
                  className={cn("transition-all duration-200", draggedItem === question.id && "opacity-50 scale-95")}
                  draggable
                  onDragStart={(e) => handleDragStart(e, question.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, question.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <Badge variant="outline">質問 {index + 1}</Badge>
                        <Badge variant="secondary">
                          {questionTemplates.find((t) => t.type === question.type)?.label}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteQuestion(question.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>質問文</Label>
                      <Input
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        onFocus={(e) => {
                          const defaultTexts = ["質問を入力してください", "満足度を教えてください", "ご意見をお聞かせください"]
                          if (defaultTexts.includes(e.target.value)) {
                            updateQuestion(question.id, { question: "" })
                          }
                        }}
                        placeholder="質問を入力してください"
                      />
                    </div>

                    {(question.type === "multiple-choice" || question.type === "yes-no") && question.options && (
                      <div className="space-y-2">
                        <Label>選択肢</Label>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center space-x-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                onFocus={(e) => {
                                  const defaultOptions = ["選択肢1", "選択肢2", "選択肢3", "はい", "いいえ"]
                                  if (defaultOptions.includes(e.target.value) || e.target.value.startsWith("選択肢")) {
                                    updateOption(question.id, optIndex, "")
                                  }
                                }}
                                placeholder={`選択肢${optIndex + 1}`}
                              />
                              {question.options && question.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(question.id, optIndex)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {question.type === "multiple-choice" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(question.id)}
                              className="w-full bg-transparent"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              選択肢を追加
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required-${question.id}`}
                          checked={question.required}
                          onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                          className="rounded border-border"
                        />
                        <Label htmlFor={`required-${question.id}`} className="text-sm">
                          必須回答
                        </Label>
                      </div>
                      
                      {question.type === "multiple-choice" && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`allow-multiple-${question.id}`}
                              checked={question.allowMultiple || false}
                              onChange={(e) => updateQuestion(question.id, { allowMultiple: e.target.checked })}
                              className="rounded border-border"
                            />
                            <Label htmlFor={`allow-multiple-${question.id}`} className="text-sm">
                              複数回答を許可
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`allow-other-${question.id}`}
                              checked={question.allowOther || false}
                              onChange={(e) => updateQuestion(question.id, { allowOther: e.target.checked })}
                              className="rounded border-border"
                            />
                            <Label htmlFor={`allow-other-${question.id}`} className="text-sm">
                              「その他」を許可
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Quick Add Question Templates */}
              <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                <CardContent className="py-6">
                  <div className="text-center space-y-4">
                    <div>
                      <h3 className="font-medium text-foreground mb-2">
                        <Plus className="w-5 h-5 inline mr-2" />
                        質問を追加
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        質問タイプを選択してください
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {questionTemplates.map((template) => {
                        const Icon = template.icon
                        const isDisabled = false
                        return (
                          <Button
                            key={template.type}
                            variant="outline"
                            size="sm"
                            className={`h-auto py-2 px-3 bg-background/80 hover:bg-background ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => addQuestion(template.type)}
                            disabled={isDisabled}
                          >
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <div className="text-left">
                                <div className="font-medium text-xs">{template.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {template.type === "yes-no" ? "0.5pt" : 
                                   template.type === "rating" ? "1pt" :
                                   template.type === "multiple-choice" ? "1pt" : "1.5pt"}
                                </div>
                              </div>
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                    
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSaving || !survey.title.trim()}
              >
                {isSaving ? (
                  <>保存中...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    下書き保存
                  </>
                )}
              </Button>
              <Button
                onClick={handlePublish}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  if (!isPublishing && survey.questions.length > 0 && survey.title.trim() && canPost) {
                    handlePublish()
                  }
                }}
                disabled={isPublishing || survey.questions.length === 0 || !survey.title.trim() || (!canPost && !isDevAccount)}
                className={!canPost && !isDevAccount ? 'opacity-60' : ''}
                title={!canPost && !isDevAccount ? `投稿権が不足しています。あと${answersUntilNextPost(surveys_answered)}回答が必要です` : ''}
              >
                {isPublishing ? (
                  <>公開中...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    公開する
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreateSurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    }>
      <CreateSurveyPageInner />
    </Suspense>
  )
}
