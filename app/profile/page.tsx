"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { isDeveloperAccount } from '@/lib/developer'
import { authenticatedFetch } from '@/lib/api-client'
import { calculateAvailablePosts, answersUntilNextPost } from '@/lib/points'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { surveyEvents } from '@/lib/analytics'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { PushNotificationSetup } from "@/components/notifications/PushNotificationSetup"
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
  Save,
  Send,
  Shield,
  Mail,
  AlertTriangle
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
  // respondent_points: number // 廃止
  // creator_points: number // 廃止
  created_at: string
  updated_at: string
  expires_at?: string // 有効期限
  last_extended_at?: string // 最後に延長した日時
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url?: string
  // points: number // 廃止 - 回答数ベースのシステムに移行
  // level: number // 廃止 - 回答数ベースのシステムに移行
  badges: string[]
  surveys_created: number
  surveys_answered: number
  total_responses_received: number
  joined_at: string
  last_answered_at?: string // 最後に回答した日時
  last_survey_extended_at?: string // 最後にアンケート有効期限を延長した日時
}

interface AnsweredSurvey {
  id: string
  survey_id: string
  survey_title: string
  // points_earned: number // 廃止
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
    date: "2時間前",
  },
  {
    type: "badge_earned",
    title: "人気クリエイター バッジを獲得",
    date: "1日前",
  },
  {
    type: "survey_created",
    title: "新商品に関するアンケートを作成",
    date: "3日前",
  },
  {
    type: "survey_completed",
    title: "働き方に関するアンケート",
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
  ブロンズ: { min: 0, max: 10, color: "bg-amber-600" },
  シルバー: { min: 10, max: 30, color: "bg-gray-400" },
  ゴールド: { min: 30, max: 60, color: "bg-yellow-500" },
  プラチナ: { min: 60, max: 100, color: "bg-blue-400" },
  ダイヤモンド: { min: 100, max: Number.POSITIVE_INFINITY, color: "bg-purple-500" },
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
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationContent, setNotificationContent] = useState("")
  const [isNotificationSending, setIsNotificationSending] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  
  const isDevAccount = user?.email ? isDeveloperAccount(user.email) : false
  const isAdmin = user?.email === 'hikarujin167@gmail.com'

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

  const fetchContacts = async () => {
    if (!isDevAccount) return

    setContactsLoading(true)
    try {
      const response = await authenticatedFetch('/api/contact/list')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      } else {
        console.error('Failed to fetch contacts')
        setContacts([])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      setContacts([])
    } finally {
      setContactsLoading(false)
    }
  }

  const handleSendNotification = async () => {
    console.log('=== 管理者通知送信開始 ===')
    console.log('Title:', notificationTitle)
    console.log('Content:', notificationContent)
    
    if (!notificationTitle.trim() || !notificationContent.trim()) {
      toast.error("通知のタイトルと内容を入力してください")
      return
    }
    
    console.log('User:', user)
    console.log('User email:', user?.email)
    console.log('Is admin?', user?.email === 'hikarujin167@gmail.com')
    
    setIsNotificationSending(true)
    try {
      console.log('Sending request to /api/admin/notifications/broadcast')
      const response = await authenticatedFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: notificationTitle,
          content: notificationContent
        })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response data:', errorData)
        throw new Error('通知の送信に失敗しました')
      }
      
      const responseData = await response.json()
      console.log('Success response data:', responseData)
      
      toast.success("全ユーザーに通知を送信しました")
      setNotificationTitle("")
      setNotificationContent("")
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error("通知の送信に失敗しました")
    } finally {
      setIsNotificationSending(false)
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
        // surveyEvents.earnPoints(data.pointsAdded, 'coupon_redemption') // ポイントシステム廃止
        toast.success(`クーポンが適用されました！投稿権+${data.postsAdded || 1}回`)
        setCouponCode('')
        
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
      const promises = [
        fetchUserData(),
        fetchUserSurveys(),
        fetchAnsweredSurveys(),
        fetchCouponHistory()
      ]

      if (isDevAccount) {
        promises.push(fetchContacts())
      }

      Promise.all(promises).finally(() => {
        setLoading(false)
      })
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Handle URL query parameter for tab
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab && ['surveys', 'answered', 'analytics', 'achievements', 'activity', 'contacts'].includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])

  // SEO対策: 構造化データ（JSON-LD）の追加
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 既存の構造化データスクリプトを削除
      const existingScript = document.querySelector('script[type="application/ld+json"][data-page="profile"]')
      if (existingScript) {
        existingScript.remove()
      }

      // BreadcrumbList スキーマ
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "ホーム",
            "item": `${window.location.origin}/`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "マイページ",
            "item": `${window.location.origin}/profile`
          }
        ]
      }

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-page', 'profile')
      script.textContent = JSON.stringify(breadcrumbSchema)
      document.head.appendChild(script)
    }
  }, [])

  // ユーザー情報が読み込まれたら、より詳細な構造化データを追加
  useEffect(() => {
    if (typeof window !== 'undefined' && localProfile) {
      const addUserStructuredData = () => {
        // 既存のユーザー構造化データスクリプトを削除
        const existingScript = document.querySelector('script[type="application/ld+json"][data-page="profile-user"]')
        if (existingScript) {
          existingScript.remove()
        }

        // ProfilePage スキーマ
        const profileSchema = {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "name": `${localProfile.name}のマイページ`,
          "description": "SurQでのアンケート活動の統計とプロフィール",
          "mainEntity": {
            "@type": "Person",
            "name": localProfile.name,
            "identifier": localProfile.id,
            ...(localProfile.avatar_url && { "image": localProfile.avatar_url })
          }
        }

        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-page', 'profile-user')
        script.textContent = JSON.stringify(profileSchema)
        document.head.appendChild(script)
      }

      addUserStructuredData()
    }
  }, [localProfile])

  const fetchUserData = async () => {
    try {
      // Auth contextからユーザーデータを使用（優先）
      if (userProfile && user) {
        const userData: UserProfile = {
          id: user.uid,
          name: user.displayName || userProfile.name || 'ユーザー',
          email: user.email || userProfile.email,
          avatar_url: user.photoURL || userProfile.avatar_url || undefined,
          // points: userProfile.points || 0, // 廃止
          // level: userProfile.level || 1, // 廃止
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
      const response = await authenticatedFetch(`/api/users/${encodeURIComponent(user.email)}/answered-surveys`)
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
            // points: data.user.points || 0, // 廃止
            surveys_answered: data.user.surveys_answered || 0,
            level: Math.floor((data.user.surveys_answered || 0) / 10) + 1
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

  // 有効期限までの残り日数を計算
  const daysUntilExpiry = (expiryDate: string) => {
    const now = new Date()
    const expiry = new Date(expiryDate)
    const diff = expiry.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  // 有効期限が近いかチェック（7日以内）
  const isExpiryApproaching = (expiryDate: string) => {
    const days = daysUntilExpiry(expiryDate)
    return days <= 7 && days > 0
  }

  // 有効期限切れかチェック
  const isExpired = (expiryDate: string) => {
    return new Date() > new Date(expiryDate)
  }

  // 今月アンケートに回答したかチェック（延長可能か）
  const hasAnsweredThisMonth = () => {
    if (!localProfile?.last_answered_at) return false
    
    const now = new Date()
    const lastAnswered = new Date(localProfile.last_answered_at)
    
    return (
      now.getFullYear() === lastAnswered.getFullYear() &&
      now.getMonth() === lastAnswered.getMonth()
    )
  }

  // 最近延長したかチェック（24時間以内）
  const hasRecentlyExtended = () => {
    if (!localProfile?.last_survey_extended_at) return false
    
    const now = new Date()
    const lastExtended = new Date(localProfile.last_survey_extended_at)
    const hoursSinceExtension = (now.getTime() - lastExtended.getTime()) / (1000 * 60 * 60)
    
    // 24時間以内に延長していれば true
    return hoursSinceExtension < 24
  }

  // 最後の延長からの経過時間を表示用にフォーマット
  const getTimeSinceLastExtension = () => {
    if (!localProfile?.last_survey_extended_at) return null
    
    const now = new Date()
    const lastExtended = new Date(localProfile.last_survey_extended_at)
    const hoursSinceExtension = (now.getTime() - lastExtended.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceExtension < 1) {
      return '数分前'
    } else if (hoursSinceExtension < 24) {
      return `${Math.floor(hoursSinceExtension)}時間前`
    } else {
      const days = Math.floor(hoursSinceExtension / 24)
      return `${days}日前`
    }
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
          ? 'アンケートが削除されました（投稿権返還なし）'
          : 'アンケートが削除され、投稿権が返還されました'
        
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
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {isDevAccount ? '∞回投稿可能' : `投稿可能: ${calculateAvailablePosts(localProfile.surveys_answered || 0, localProfile.surveys_created || 0)}回`}
              </Badge>
              {isDevAccount && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Shield className="w-3 h-3 mr-1" />
                  管理者
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <NotificationBell />
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
                    {isDevAccount && (
                      <Link href="/admin/dashboard">
                        <Button variant="outline" className="w-full justify-start bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                          <Shield className="w-4 h-4 mr-2" />
                          管理者ダッシュボード
                        </Button>
                      </Link>
                    )}
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
            </div>

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
                  </div>
                  
                  {/* 回答数表示 - 大きく目立たせる */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Trophy className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-800">あなたの回答数</span>
                      </div>
                      <div className="text-5xl font-bold text-green-600 mb-1">
                        {localProfile.surveys_answered || 0}
                      </div>
                      <div className="text-lg text-green-700 font-medium mb-3">
                        回答
                      </div>
                      {/* マイルストーン表示 */}
                      <div className="space-y-1 text-xs text-green-700">
                        {(localProfile.surveys_answered || 0) < 10 && (
                          <div className="flex items-center justify-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>次の目標: 10回答</span>
                          </div>
                        )}
                        {(localProfile.surveys_answered || 0) >= 10 && (localProfile.surveys_answered || 0) < 50 && (
                          <div className="flex items-center justify-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>次の目標: 50回答</span>
                          </div>
                        )}
                        {(localProfile.surveys_answered || 0) >= 50 && (localProfile.surveys_answered || 0) < 100 && (
                          <div className="flex items-center justify-center space-x-1">
                            <Medal className="w-3 h-3" />
                            <span>次の目標: 100回答（マスター）</span>
                          </div>
                        )}
                        {(localProfile.surveys_answered || 0) >= 100 && (
                          <div className="flex items-center justify-center space-x-1">
                            <Crown className="w-3 h-3" />
                            <span>🎉 アンケートマスター達成！</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* 投稿可能回数表示 */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">投稿可能回数</span>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {isDevAccount ? '∞' : calculateAvailablePosts(localProfile.surveys_answered || 0, localProfile.surveys_created || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        回
                      </div>
                      {!isDevAccount && (
                        <div className="space-y-2 mt-3">
                          <div className="text-xs text-muted-foreground">
                            あと{answersUntilNextPost(localProfile.surveys_answered || 0)}回答で+1回
                          </div>
                          {/* プログレスバー */}
                          <Progress 
                            value={((localProfile.surveys_answered || 0) % 4) * 25} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Level Progress */}
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Trophy className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-green-600">{localProfile.surveys_answered}</div>
                    <div className="text-xs text-green-700 font-medium">回答数</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-600">{localProfile.surveys_created}</div>
                    <div className="text-xs text-blue-700 font-medium">作成数</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg col-span-2">
                    <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-purple-600">{localProfile.total_responses_received}</div>
                    <div className="text-xs text-purple-700 font-medium">受け取った総回答数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notification Panel */}
            {isAdmin && (
              <Card className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-800">
                    <Shield className="w-5 h-5" />
                    <span>管理者機能 - 全体通知</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-title">通知タイトル</Label>
                    <Input
                      id="notification-title"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="例: システムメンテナンスのお知らせ"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-content">通知内容</Label>
                    <Textarea
                      id="notification-content"
                      value={notificationContent}
                      onChange={(e) => setNotificationContent(e.target.value)}
                      placeholder="例: 明日の午前2時〜4時の間、システムメンテナンスを実施いたします。"
                      rows={4}
                      className="bg-white"
                    />
                  </div>
                  <Button 
                    onClick={handleSendNotification}
                    disabled={isNotificationSending || !notificationTitle.trim() || !notificationContent.trim()}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isNotificationSending ? "送信中..." : "全ユーザーに通知を送信"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 gap-1 sm:gap-0 h-auto sm:h-10 p-1">
                <TabsTrigger value="surveys" className="text-xs sm:text-sm py-2 px-2 sm:px-3">公開済み</TabsTrigger>
                <TabsTrigger value="drafts" className="text-xs sm:text-sm py-2 px-2 sm:px-3">下書き</TabsTrigger>
                <TabsTrigger value="answered" className="text-xs sm:text-sm py-2 px-2 sm:px-3">回答済み</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 px-2 sm:px-3">設定</TabsTrigger>
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
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                  <span>質問数: {survey.questions.length}</span>
                                  <span>回答数: {survey.response_count}</span>
                                  <span>作成日: {formatDate(survey.created_at)}</span>
                                  {/* 有効期限を作成日の隣に表示 */}
                                  {survey.expires_at && (
                                    <>
                                      {isExpired(survey.expires_at) ? (
                                        <span className="text-red-600 font-medium flex items-center">
                                          <AlertTriangle className="w-3 h-3 mr-1" />
                                          期限: 期限切れ
                                        </span>
                                      ) : isExpiryApproaching(survey.expires_at) ? (
                                        <span className="text-yellow-700 font-medium flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          期限: {formatDate(survey.expires_at)} (残り{daysUntilExpiry(survey.expires_at)}日)
                                        </span>
                                      ) : (
                                        <span className="text-green-700 font-medium flex items-center">
                                          <Clock className="w-3 h-3 mr-1" />
                                          期限: {formatDate(survey.expires_at)} (残り{daysUntilExpiry(survey.expires_at)}日)
                                        </span>
                                      )}
                                    </>
                                  )}
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

                                    {/* 回答を見る（デバッグ: 常に表示） */}
                                    <DropdownMenuItem onClick={() => {
                                      console.log('Survey data:', survey) // デバッグログ
                                      window.open(`/survey/${survey.id}/responses`, '_blank')
                                    }}>
                                      <BarChart3 className="w-4 h-4 mr-2" />
                                      回答を見る ({survey.response_count || 0}件)
                                    </DropdownMenuItem>
                                    
                                    {/* 編集する（デバッグ: 常に表示） */}
                                    <DropdownMenuItem onClick={() => {
                                        window.location.href = `/survey/create?edit=${survey.id}`
                                      }}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        編集する
                                      </DropdownMenuItem>
                                    
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
                                                回答者がいないため、投稿権が返還されます。
                                              </span>
                                            ) : (
                                              <span className="block mt-2 text-red-600">
                                                既に{survey.response_count}件の回答があるため、投稿権の返還はありません。
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
                {/* 回答数サマリー */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Trophy className="w-6 h-6 text-green-600" />
                          <h3 className="text-lg font-semibold text-green-800">総回答数</h3>
                        </div>
                        <div className="text-4xl font-bold text-green-600 mb-1">
                          {localProfile.surveys_answered || 0}
                        </div>
                        <p className="text-sm text-green-700">
                          これまで{localProfile.surveys_answered || 0}件のアンケートに回答しました
                        </p>
                        {!isDevAccount && (
                          <p className="text-xs text-green-600 mt-2 flex items-center">
                            <Zap className="w-3 h-3 mr-1" />
                            あと{answersUntilNextPost(localProfile.surveys_answered || 0)}回答で新しい投稿権を獲得！
                          </p>
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Trophy className="w-12 h-12 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                                    回答済み
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <span>回答日: {formatDate(survey.submitted_at)}</span>
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
                              総回答数: {answeredSurveys.length}件
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
                          <p className="text-xs text-muted-foreground">投稿可能回数</p>
                          <p className="text-lg font-bold text-foreground">{isDevAccount ? '∞' : calculateAvailablePosts(localProfile?.surveys_answered || 0, localProfile?.surveys_created || 0)}</p>
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

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-primary" />
                      <span>アカウント設定</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Push Notification Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">通知設定</h3>
                      <PushNotificationSetup />
                    </div>

                    {/* Other Settings */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">その他の設定</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <User className="w-4 h-4 mr-2" />
                          プロフィール編集
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Eye className="w-4 h-4 mr-2" />
                          プライバシー設定
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => setShowCouponDialog(true)}
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          クーポンコード入力
                        </Button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-red-600 mb-4">危険な操作</h3>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                      </Button>
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
