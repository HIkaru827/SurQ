"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { isDeveloperAccount } from '@/lib/developer'
import { authenticatedFetch } from '@/lib/api-client'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  Settings, 
  Trophy, 
  Star, 
  MessageSquare, 
  BarChart3,
  Edit,
  Plus,
  Eye,
  Users,
  ArrowLeft,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Crown,
  Zap,
  Medal,
  LogOut,
  Clock,
  Download,
  Share2,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Gift,
  Ticket,
  Save
} from 'lucide-react'
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface Survey {
  id: string
  title: string
  description: string | null
  questions: any[]
  is_published: boolean
  response_count: number
  respondent_points: number
  creator_points: number
  created_at: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
  points: number
  level: number
  badges: string[]
  surveys_created: number
  surveys_answered: number
  total_responses_received: number
  joined_at: string
}

interface AnsweredSurvey {
  id: string
  survey_id: string
  survey_title: string
  points_earned: number
  submitted_at: string
  responses: any
}

const badges = [
  {
    id: "first-survey",
    name: "初回回答",
    description: "初めてアンケートに回答しました",
    icon: Target,
    color: "bg-blue-500",
    earned: true,
    earnedDate: "2024年1月15日",
  },
  {
    id: "survey-master",
    name: "アンケートマスター",
    description: "50回以上アンケートに回答",
    icon: Trophy,
    color: "bg-yellow-500",
    earned: false,
    progress: 47,
    target: 50,
  },
  {
    id: "creator",
    name: "クリエイター",
    description: "初めてアンケートを作成しました",
    icon: Trophy,
    color: "bg-purple-500",
    earned: true,
    earnedDate: "2024年2月3日",
  },
  {
    id: "streak-week",
    name: "継続の力",
    description: "7日連続でアンケートに回答",
    icon: Star,
    color: "bg-orange-500",
    earned: true,
    earnedDate: "2024年2月20日",
  },
  {
    id: "popular-creator",
    name: "人気クリエイター",
    description: "作成したアンケートが100回以上回答された",
    icon: Trophy,
    color: "bg-pink-500",
    earned: true,
    earnedDate: "2024年3月5日",
  },
  {
    id: "feedback-king",
    name: "フィードバック王",
    description: "100回以上アンケートに回答",
    icon: Trophy,
    color: "bg-green-500",
    earned: false,
    progress: 47,
    target: 100,
  },
]

const recentActivity = [
  {
    type: "survey_completed",
    title: "カフェの利用体験に関するアンケート",
    points: 50,
    date: "2時間前",
  },
  {
    type: "badge_earned",
    title: "人気クリエイター バッジを獲得",
    points: 100,
    date: "1日前",
  },
  {
    type: "survey_created",
    title: "新商品に関するアンケートを作成",
    points: 25,
    date: "3日前",
  },
  {
    type: "survey_completed",
    title: "働き方に関するアンケート",
    points: 75,
    date: "5日前",
  },
]

// Mock analytics data
const mockAnalytics = {
  overview: {
    totalSurveys: 0,
    totalResponses: 0,
    avgCompletionRate: 0,
    avgResponseTime: "0分",
  },
  responsesTrend: [
    { date: "3/1", responses: 0, completions: 0 },
    { date: "3/2", responses: 0, completions: 0 },
    { date: "3/3", responses: 0, completions: 0 },
    { date: "3/4", responses: 0, completions: 0 },
    { date: "3/5", responses: 0, completions: 0 },
    { date: "3/6", responses: 0, completions: 0 },
    { date: "3/7", responses: 0, completions: 0 },
  ],
  demographics: {
    age: [
      { name: "18-24", value: 0, color: "#059669" },
      { name: "25-34", value: 0, color: "#10b981" },
      { name: "35-44", value: 0, color: "#34d399" },
      { name: "45-54", value: 0, color: "#6ee7b7" },
      { name: "55+", value: 0, color: "#a7f3d0" },
    ],
  },
}

const levelInfo = {
  ブロンズ: { min: 0, max: 500, color: "bg-amber-600" },
  シルバー: { min: 500, max: 2000, color: "bg-gray-400" },
  ゴールド: { min: 2000, max: 5000, color: "bg-yellow-500" },
  プラチナ: { min: 5000, max: 10000, color: "bg-blue-400" },
  ダイヤモンド: { min: 10000, max: Number.POSITIVE_INFINITY, color: "bg-purple-500" },
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('surveys')
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null)
  const [userSurveys, setUserSurveys] = useState<Survey[]>([])
  const [draftSurveys, setDraftSurveys] = useState<Survey[]>([])
  const [answeredSurveys, setAnsweredSurveys] = useState<AnsweredSurvey[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [couponHistory, setCouponHistory] = useState<any[]>([])
  const [couponLoading, setCouponLoading] = useState(false)
  const [showCouponDialog, setShowCouponDialog] = useState(false)
  
  const isDevAccount = user?.email ? isDeveloperAccount(user.email) : false

  const fetchCouponHistory = async () => {
    if (!user?.email) return
    
    try {
      const response = await authenticatedFetch(`/api/coupons?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setCouponHistory(data.history || [])
      } else {
        console.error('Failed to fetch coupon history')
        setCouponHistory([])
      }
    } catch (error) {
      console.error('Error fetching coupon history:', error)
      setCouponHistory([])
    }
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('クーポンコードを入力してください')
      return
    }

    if (!user?.email) {
      toast.error('ユーザー情報が見つかりません')
      return
    }

    setCouponLoading(true)
    try {
      const response = await authenticatedFetch('/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          couponCode: couponCode.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 成功時の処理
        toast.success(`${data.pointsAdded}ポイントが追加されました！`)
        setCouponCode('')
        
        // ローカルプロフィールのポイントを即座に更新
        if (localProfile) {
          setLocalProfile({
            ...localProfile,
            points: data.newTotal
          })
        }
        
        // AuthContextのキャッシュもクリア
        if (user?.uid) {
          sessionStorage.removeItem(`profile_${user.uid}`)
        }
        
        await fetchCouponHistory()
        
        // AuthContextのプロフィールを更新
        await refreshProfile()
        
        // ローカルプロフィールも再取得
        await refreshUserProfile()
        
      } else {
        toast.error(data.error || 'クーポンの適用に失敗しました')
      }
    } catch (error) {
      console.error('Error applying coupon:', error)
      toast.error('クーポンの適用に失敗しました')
    } finally {
      setCouponLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // 認証されていない場合はログインページにリダイレクト
        router.push('/login')
        return
      }
      // 並列実行で高速化
      Promise.all([
        fetchUserData(),
        fetchUserSurveys(),
        fetchAnsweredSurveys()
      ]).finally(() => {
        setLoading(false)
      })
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Handle URL query parameter for tab
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab && ['surveys', 'answered', 'analytics', 'achievements', 'activity'].includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])

  const fetchUserData = async () => {
    try {
      // Auth contextからユーザーデータを使用（優先）
      if (userProfile && user) {
        const userData: UserProfile = {
          id: user.uid,
          name: user.displayName || userProfile.name || 'ユーザー',
          email: user.email || userProfile.email,
          avatar_url: user.photoURL || userProfile.avatar_url || undefined,
          points: userProfile.points || 0,
          level: userProfile.level || 1,
          badges: userProfile.badges || [],
          surveys_created: userProfile.surveys_created || 0,
          surveys_answered: userProfile.surveys_answered || 0,
          total_responses_received: userProfile.total_responses_received || 0,
          joined_at: userProfile.created_at || new Date().toISOString()
        }
        setLocalProfile(userData)
        return
      }

      // フォールバック: Firebase認証情報のみ使用
      if (user) {
        const userData: UserProfile = {
          id: user.uid,
          name: user.displayName || 'ユーザー',
          email: user.email || 'user@example.com',
          avatar_url: user.photoURL || undefined,
          points: 0,
          level: 1,
          badges: [],
          surveys_created: 0,
          surveys_answered: 0,
          total_responses_received: 0,
          joined_at: new Date().toISOString()
        }
        setLocalProfile(userData)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      if (user) {
        const userData: UserProfile = {
          id: user.uid,
          name: user.displayName || 'ユーザー',
          email: user.email || 'user@example.com',
          avatar_url: user.photoURL || undefined,
          points: 0,
          level: 1,
          badges: [],
          surveys_created: 0,
          surveys_answered: 0,
          total_responses_received: 0,
          joined_at: new Date().toISOString()
        }
        setLocalProfile(userData)
      }
    }
  }

  const fetchUserSurveys = async () => {
    try {
      // Firebase認証からユーザーUIDを取得
      if (!user?.uid) {
        setUserSurveys([])
        setDraftSurveys([])
        return
      }
      
      // ユーザー自身のアンケートのみを取得
      const response = await authenticatedFetch(`/api/surveys?creator_id=${user.uid}&include_unpublished=true`)
      if (response.ok) {
        const data = await response.json()
        console.log('Survey API Response:', data)
        console.log('Creator ID used:', user.uid)
        console.log('Surveys found:', data.surveys?.length || 0)
        
        const allSurveys = data.surveys || []
        const publishedSurveys = allSurveys.filter((survey: Survey) => survey.is_published)
        const draftSurveysData = allSurveys.filter((survey: Survey) => !survey.is_published)
        
        setUserSurveys(publishedSurveys)
        setDraftSurveys(draftSurveysData)
      } else {
        console.error('Survey API Error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching user surveys:', error)
      setUserSurveys([])
      setDraftSurveys([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAnsweredSurveys = async () => {
    if (!user?.email) {
      setAnsweredSurveys([])
      return
    }
    
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.email)}/answered-surveys`)
      if (response.ok) {
        const data = await response.json()
        console.log('Answered surveys API response:', data)
        console.log('User email used:', user.email)
        console.log('Answered surveys found:', data.surveys?.length || 0)
        setAnsweredSurveys(data.surveys || [])
      } else {
        console.error('Failed to fetch answered surveys', response.status, response.statusText)
        setAnsweredSurveys([])
      }
    } catch (error) {
      console.error('Error fetching answered surveys:', error)
      setAnsweredSurveys([])
    }
  }

  const refreshUserProfile = async () => {
    if (!user?.email) return
    
    try {
      // APIから最新のユーザーデータを取得
      const response = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          // ローカルプロフィールを更新
          setLocalProfile(prevProfile => ({
            ...prevProfile!,
            points: data.user.points || 0,
            surveys_answered: data.user.surveys_answered || 0,
            level: Math.floor((data.user.points || 0) / 100) + 1
          }))
        }
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDeleteSurvey = async (surveyId: string, hasResponses: boolean) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // アンケート一覧から削除
        setUserSurveys(prev => prev.filter(survey => survey.id !== surveyId))
        
        const message = hasResponses 
          ? 'アンケートが削除されました（ポイント返還なし）'
          : 'アンケートが削除され、ポイントが返還されました'
        
        toast.success(message)
        
        // マイページ情報を再読み込み
        await fetchUserData()
      } else {
        throw new Error('削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting survey:', error)
      toast.error('削除に失敗しました')
    }
  }

  const getProgressToNextLevel = () => {
    if (!localProfile) return 0
    const pointsForCurrentLevel = localProfile.level * 100
    const pointsForNextLevel = (localProfile.level + 1) * 100
    const currentProgress = localProfile.points - pointsForCurrentLevel
    const totalNeeded = pointsForNextLevel - pointsForCurrentLevel
    return Math.min(100, (currentProgress / totalNeeded) * 100)
  }

  const getCurrentLevelName = () => {
    if (!localProfile) return 'ブロンズ'
    const points = localProfile.points
    if (points >= 10000) return 'ダイヤモンド'
    if (points >= 5000) return 'プラチナ'
    if (points >= 2000) return 'ゴールド'
    if (points >= 500) return 'シルバー'
    return 'ブロンズ'
  }

  const levelProgress = getProgressToNextLevel()
  const currentLevelName = getCurrentLevelName()
  const currentLevelInfo = levelInfo[currentLevelName as keyof typeof levelInfo]

  const handleLogout = () => {
    try {
      // セッションやローカルストレージをクリア
      localStorage.removeItem('user')
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser') // ログインユーザー情報もクリア
      
      // セッションストレージもクリア
      sessionStorage.clear()
      
      // 成功通知
      toast.success('ログアウトしました')
      
      // 少し遅延してからリダイレクト（通知が見えるように）
      setTimeout(() => {
        router.push('/')
      }, 1000)
      
    } catch (error) {
      console.error('ログアウトエラー:', error)
      toast.error('ログアウトに失敗しました')
    }
  }

  // 認証チェックとローディング状態を統合
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-muted-foreground">読み込み中...</div>
        </div>
      </div>
    )
  }

  // ユーザーが認証されていない場合（すでにリダイレクトされているはず）
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-muted-foreground">認証情報を確認中...</div>
        </div>
      </div>
    )
  }

  // マイページデータがまだ取得されていない場合
  if (!localProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-muted-foreground">マイページを読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            <div className="flex items-center space-x-4">
              <h1 className="font-semibold text-foreground">マイページ</h1>
              <Badge variant="secondary" className={`${isDevAccount ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-primary/10 text-primary border-primary/20'}`}>
                {isDevAccount ? '∞pt (開発者)' : `${localProfile.points.toLocaleString()}pt`}
              </Badge>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>設定</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="w-4 h-4 mr-2" />
                      マイページ編集
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      通知設定
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="w-4 h-4 mr-2" />
                      プライバシー設定
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        setShowCouponDialog(true)
                        fetchCouponHistory()
                      }}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      クーポン
                    </Button>
                  </div>
                  <hr className="my-4" />
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    ログアウト
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Coupon Dialog */}
            <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    クーポン
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Coupon Input Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">クーポンコードを入力</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Label htmlFor="coupon-code">クーポンコード</Label>
                          <Input
                            id="coupon-code"
                            placeholder="クーポンコードを入力してください"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                applyCoupon()
                              }
                            }}
                          />
                        </div>
                        <Button 
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="mt-6"
                        >
                          {couponLoading ? '適用中...' : '適用'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Coupon History Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">クーポン使用履歴</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {couponHistory.length > 0 ? (
                        <div className="space-y-3">
                          {couponHistory.map((coupon) => (
                            <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                  <Ticket className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">{coupon.code}</div>
                                  <div className="text-sm text-muted-foreground">{coupon.description}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(coupon.usedAt).toLocaleDateString('ja-JP')}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                +{coupon.points}pt
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>まだクーポンを使用していません</p>
                          <p className="text-sm">上記からクーポンコードを入力して、ポイントを獲得しましょう！</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Avatar className="w-20 h-20 mx-auto">
                    <AvatarImage src={localProfile.avatar_url || "/placeholder.svg"} alt={localProfile.name} />
                    <AvatarFallback className="text-2xl">{localProfile.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{localProfile.name}</h2>
                    <p className="text-muted-foreground">{localProfile.email}</p>
                    <p className="text-sm text-muted-foreground mt-1">参加日: {formatDate(localProfile.joined_at)}</p>
                    {/* Debug info */}
                    <div className="text-xs text-muted-foreground mt-2 bg-muted/20 p-2 rounded">
                      <div>Firebase UID: {user?.uid}</div>
                      <div>Firebase Email: {user?.email}</div>
                      <div>開発者モード: {isDevAccount ? 'はい' : 'いいえ'}</div>
                    </div>
                  </div>
                  
                  {/* 保有ポイント表示 */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">保有ポイント</span>
                      </div>
                      <div className={`text-3xl font-bold ${isDevAccount ? 'text-purple-600' : 'text-primary'}`}>
                        {isDevAccount ? '∞' : localProfile.points.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {isDevAccount ? '開発者ポイント' : 'ポイント'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span>レベル</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge variant="secondary" className={cn("text-white text-lg px-4 py-2", currentLevelInfo.color)}>
                    {currentLevelName}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>次のレベルまで</span>
                    <span className="font-medium">{((localProfile.level + 1) * 100 - localProfile.points)}pt</span>
                  </div>
                  <Progress value={levelProgress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lv.{localProfile.level}</span>
                    <span>Lv.{localProfile.level + 1}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{localProfile.surveys_answered}</div>
                    <div className="text-xs text-muted-foreground">回答数</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{localProfile.surveys_created}</div>
                    <div className="text-xs text-muted-foreground">作成数</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{localProfile.total_responses_received}</div>
                    <div className="text-xs text-muted-foreground">総回答数</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">Lv.{localProfile.level}</div>
                    <div className="text-xs text-muted-foreground">レベル</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-0 h-auto sm:h-10 p-1">
                <TabsTrigger value="surveys" className="text-xs sm:text-sm py-2 px-2 sm:px-3">公開済み</TabsTrigger>
                <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2 sm:px-3">下書き</TabsTrigger>
                <TabsTrigger value="answered" className="text-xs sm:text-sm py-2 px-2 sm:px-3">回答済み</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2 sm:px-3">分析</TabsTrigger>
                <TabsTrigger value="achievements" className="text-xs sm:text-sm py-2 px-2 sm:px-3">実績</TabsTrigger>
                <TabsTrigger value="activity" className="text-xs sm:text-sm py-2 px-2 sm:px-3">活動</TabsTrigger>
              </TabsList>

              {/* Surveys Tab */}
              <TabsContent value="surveys" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span>公開済みアンケート</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userSurveys.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">公開中のアンケートはありません</h3>
                        <p className="text-muted-foreground mb-4">
                          あなたの最初のアンケートを作成してみましょう
                        </p>
                        {/* Debug info */}
                        <div className="text-xs text-muted-foreground mb-4 bg-muted/20 p-2 rounded">
                          <div>検索中のcreator_id: {user?.uid}</div>
                          <div>ログインユーザー: {user?.email}</div>
                          <div>Firebase UID: {user?.uid}</div>
                        </div>
                        <Link href="/survey/create">
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            アンケートを作成
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userSurveys.map((survey) => (
                          <div key={survey.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-foreground">{survey.title}</h3>
                                  <Badge variant={survey.is_published ? "default" : "secondary"}>
                                    {survey.is_published ? "公開中" : "下書き"}
                                  </Badge>
                                </div>
                                {survey.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{survey.description}</p>
                                )}
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>質問数: {survey.questions.length}</span>
                                  <span>回答数: {survey.response_count}</span>
                                  <span>獲得ポイント: {survey.creator_points}pt</span>
                                  <span>作成日: {formatDate(survey.created_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {/* 詳細を見る */}
                                    <DropdownMenuItem onClick={() => {
                                      if (survey.is_published) {
                                        // 公開済みの場合、アンケート詳細ページへ
                                        window.open(`/survey/${survey.id}`, '_blank')
                                      } else {
                                        // 下書きの場合、編集ページへ
                                        window.open(`/survey/create?edit=${survey.id}`, '_blank')
                                      }
                                    }}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      詳細を見る
                                    </DropdownMenuItem>
                                    
                                    {/* 編集する（回答者がゼロの場合のみ） */}
                                    {survey.response_count === 0 && (
                                      <DropdownMenuItem onClick={() => {
                                        window.location.href = `/survey/create?edit=${survey.id}`
                                      }}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        編集する
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {/* 削除する */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          className="text-destructive focus:text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          削除する
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>アンケートの削除</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            「{survey.title}」を削除しますか？
                                            {survey.response_count === 0 ? (
                                              <span className="block mt-2 text-green-600">
                                                回答者がいないため、消費したポイント（{survey.creator_points}pt）が返還されます。
                                              </span>
                                            ) : (
                                              <span className="block mt-2 text-red-600">
                                                既に{survey.response_count}件の回答があるため、ポイントの返還はありません。
                                              </span>
                                            )}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteSurvey(survey.id, survey.response_count > 0)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            削除する
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Draft Surveys Tab */}
              <TabsContent value="drafts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Save className="w-5 h-5 text-primary" />
                      <span>下書きアンケート</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {draftSurveys.length === 0 ? (
                      <div className="text-center py-8">
                        <Save className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">下書きはありません</h3>
                        <p className="text-muted-foreground mb-4">
                          アンケートを下書きとして保存すると、ここに表示されます
                        </p>
                        <Link href="/survey/create">
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            アンケートを作成
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {draftSurveys.map((survey) => (
                          <div key={survey.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-foreground">{survey.title}</h3>
                                  <Badge variant="secondary">下書き</Badge>
                                </div>
                                {survey.description && (
                                  <p className="text-muted-foreground mb-2 line-clamp-2">
                                    {survey.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    {survey.questions?.length || 0}問
                                  </span>
                                  <span>
                                    作成日: {new Date(survey.created_at || '').toLocaleDateString('ja-JP')}
                                  </span>
                                  <span>
                                    更新日: {new Date(survey.updated_at || '').toLocaleDateString('ja-JP')}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/survey/create?edit=${survey.id}`}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    編集
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/survey/create?edit=${survey.id}`}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        編集
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem 
                                          onSelect={(e) => e.preventDefault()}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          削除
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>下書きを削除しますか？</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            この操作は取り消せません。下書き「{survey.title}」が完全に削除されます。
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteSurvey(survey.id, false)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            削除する
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Answered Surveys Tab */}
              <TabsContent value="answered" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <span>回答済みアンケート</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {answeredSurveys.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">まだアンケートに回答していません</h3>
                        <p className="text-muted-foreground mb-4">
                          アンケートに回答してポイントを獲得しましょう！
                        </p>
                        <Link href="/app#surveys">
                          <Button>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            アンケートを探す
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {answeredSurveys.map((survey) => (
                          <div key={survey.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-foreground">{survey.survey_title}</h3>
                                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                                    +{survey.points_earned}pt
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>回答日: {formatDate(survey.submitted_at)}</span>
                                  <span>獲得ポイント: {survey.points_earned}pt</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Link href={`/survey/${survey.survey_id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    詳細を見る
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {answeredSurveys.length > 0 && (
                          <div className="text-center pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              総獲得ポイント: {answeredSurveys.reduce((sum, survey) => sum + survey.points_earned, 0)}pt
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">総アンケート数</p>
                          <p className="text-lg font-bold text-foreground">{localProfile?.surveys_created || 0}</p>
                        </div>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">総回答数</p>
                          <p className="text-lg font-bold text-foreground">{localProfile?.total_responses_received || 0}</p>
                        </div>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">平均回答数</p>
                          <p className="text-lg font-bold text-foreground">
                            {localProfile?.surveys_created && localProfile.surveys_created > 0 
                              ? Math.round(localProfile.total_responses_received / localProfile.surveys_created)
                              : 0
                            }
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">総ポイント</p>
                          <p className="text-lg font-bold text-foreground">{localProfile?.points || 0}</p>
                        </div>
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {userSurveys.length > 0 ? (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Response Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm">回答トレンド</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockAnalytics.responsesTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="responses"
                                stroke="#059669"
                                fill="#059669"
                                fillOpacity={0.6}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Survey Performance */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          <span className="text-sm">アンケート別パフォーマンス</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userSurveys.slice(0, 5)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="title" 
                                angle={-45} 
                                textAnchor="end" 
                                height={60}
                                interval={0}
                                fontSize={10}
                              />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="response_count" fill="#059669" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}

                {/* Ranking Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span>ランキング</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-bold text-primary">#42</div>
                      <p className="text-muted-foreground">
                        全{(1250).toLocaleString()}人中 42位
                      </p>
                      <div className="flex justify-center space-x-4">
                        <Button variant="outline" size="sm">
                          <Trophy className="w-4 h-4 mr-2" />
                          ランキングを見る
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {userSurveys.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">アナリティクスデータがありません</h3>
                      <p className="text-muted-foreground mb-4">
                        アンケートを作成して回答を収集すると、詳細な分析データが表示されます
                      </p>
                      <Link href="/survey/create">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          最初のアンケートを作成
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span>バッジコレクション</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {badges.map((badge) => {
                        const Icon = badge.icon
                        return (
                          <div
                            key={badge.id}
                            className={cn(
                              "p-4 rounded-lg border transition-all",
                              badge.earned ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border opacity-60",
                            )}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center",
                                  badge.earned ? badge.color : "bg-muted",
                                )}
                              >
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground">{badge.name}</h3>
                                <p className="text-sm text-muted-foreground">{badge.description}</p>
                                {badge.earned ? (
                                  <p className="text-xs text-primary mt-1">獲得日: {badge.earnedDate}</p>
                                ) : badge.progress !== undefined ? (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span>進捗</span>
                                      <span>
                                        {badge.progress}/{badge.target}
                                      </span>
                                    </div>
                                    <Progress value={(badge.progress / badge.target!) * 100} className="h-2" />
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-1">未獲得</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span>最近のアクティビティ</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/30">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            {activity.type === "survey_completed" && <Target className="w-5 h-5 text-primary" />}
                            {activity.type === "badge_earned" && <Trophy className="w-5 h-5 text-primary" />}
                            {activity.type === "survey_created" && <Plus className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{activity.title}</p>
                            <p className="text-sm text-muted-foreground">{activity.date}</p>
                          </div>
                          <Badge variant="secondary">+{activity.points}pt</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
