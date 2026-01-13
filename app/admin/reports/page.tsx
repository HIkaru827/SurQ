"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { authenticatedFetch } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, Eye, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Report {
  id: string
  survey_id: string
  survey_title: string
  reporter_id: string
  reporter_name: string
  reported_user_id: string
  reported_user_name: string
  reason: string
  details: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  admin_notes?: string
  response_data?: {
    last_opened_at: string
    completed_at: string
    estimated_duration_minutes: number
  }
  penalty_applied?: boolean
  created_at: string
  updated_at: string
}

const statusConfig = {
  pending: { label: '未対応', icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200' },
  investigating: { label: '調査中', icon: Eye, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  resolved: { label: '対応完了', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200' },
  dismissed: { label: '却下', icon: XCircle, color: 'bg-gray-100 text-gray-800 border-gray-200' },
}

const reasonLabels: Record<string, string> = {
  not_answered: '回答していない',
  suspicious_duration: '所要時間が不自然',
  other: 'その他',
}

export default function ReportsManagementPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending')

  // 詳細ダイアログ
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [applyPenalty, setApplyPenalty] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await authenticatedFetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('通報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report)
    setNewStatus(report.status)
    setAdminNotes(report.admin_notes || '')
    setApplyPenalty(report.penalty_applied || false)
    setDetailDialogOpen(true)
  }

  const handleUpdateReport = async () => {
    if (!selectedReport) return

    setUpdating(true)

    try {
      const response = await authenticatedFetch(`/api/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes,
          apply_penalty: applyPenalty && newStatus === 'resolved',
        }),
      })

      if (response.ok) {
        toast.success('通報を更新しました')
        setDetailDialogOpen(false)
        fetchReports() // リロード
      } else {
        const data = await response.json()
        toast.error(data.error || '更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating report:', error)
      toast.error('更新に失敗しました')
    } finally {
      setUpdating(false)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  const pendingReports = reports.filter(r => r.status === 'pending')
  const displayReports = selectedTab === 'pending' ? pendingReports : reports

  const statusCounts = {
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">通報管理</h1>
              <p className="text-sm text-gray-600 mt-1">Googleフォーム回答の不正報告</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard">ダッシュボードに戻る</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                未対応
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{statusCounts.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                調査中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{statusCounts.investigating}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                対応完了
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{statusCounts.resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                却下
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{statusCounts.dismissed}</div>
            </CardContent>
          </Card>
        </div>

        {/* タブとリスト */}
        <Card>
          <CardHeader>
            <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'pending' | 'all')}>
              <TabsList>
                <TabsTrigger value="pending">
                  未対応 ({statusCounts.pending})
                </TabsTrigger>
                <TabsTrigger value="all">
                  全て ({reports.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {displayReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {selectedTab === 'pending' ? '未対応の通報はありません' : '通報はありません'}
              </div>
            ) : (
              <div className="space-y-4">
                {displayReports.map((report) => {
                  const StatusIcon = statusConfig[report.status].icon
                  
                  return (
                    <div
                      key={report.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={statusConfig[report.status].color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[report.status].label}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString('ja-JP')}
                            </span>
                            {report.penalty_applied && (
                              <Badge variant="destructive" className="text-xs">
                                ペナルティ適用済み
                              </Badge>
                            )}
                          </div>

                          <div className="mb-2">
                            <h3 className="font-semibold text-lg">
                              {report.survey_title || 'タイトルなし'}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">通報者:</span>{' '}
                              <span className="font-medium">{report.reporter_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">対象者:</span>{' '}
                              <span className="font-medium">{report.reported_user_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">理由:</span>{' '}
                              <span className="font-medium">{reasonLabels[report.reason] || report.reason}</span>
                            </div>
                            {report.response_data && (
                              <div>
                                <span className="text-gray-500">所要時間:</span>{' '}
                                <span className="font-medium">
                                  {formatDuration(report.response_data.estimated_duration_minutes)}
                                </span>
                              </div>
                            )}
                          </div>

                          {report.details && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {report.details}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(report)}
                        >
                          詳細
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 詳細ダイアログ */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>通報詳細</DialogTitle>
            <DialogDescription>
              通報内容を確認し、適切な対応を選択してください
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              {/* 通報情報 */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">通報情報</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">アンケート:</span>{' '}
                    <span className="font-medium">{selectedReport.survey_title}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">通報日時:</span>{' '}
                    <span className="font-medium">
                      {new Date(selectedReport.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">通報者:</span>{' '}
                    <span className="font-medium">{selectedReport.reporter_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">対象者:</span>{' '}
                    <span className="font-medium">{selectedReport.reported_user_name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">理由:</span>{' '}
                    <span className="font-medium">{reasonLabels[selectedReport.reason] || selectedReport.reason}</span>
                  </div>
                  {selectedReport.details && (
                    <div className="col-span-2">
                      <span className="text-gray-500">詳細:</span>
                      <p className="mt-1 text-gray-700">{selectedReport.details}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 回答データ */}
              {selectedReport.response_data && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-2">回答データ</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">最終アクセス:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedReport.response_data.last_opened_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">完了時刻:</span>{' '}
                      <span className="font-medium">
                        {new Date(selectedReport.response_data.completed_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">所要時間:</span>{' '}
                      <span className="font-medium text-lg">
                        {formatDuration(selectedReport.response_data.estimated_duration_minutes)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ステータス更新 */}
              <div className="space-y-2">
                <Label>ステータス</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">未対応</SelectItem>
                    <SelectItem value="investigating">調査中</SelectItem>
                    <SelectItem value="resolved">対応完了</SelectItem>
                    <SelectItem value="dismissed">却下</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 管理者メモ */}
              <div className="space-y-2">
                <Label>管理者メモ</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="対応内容や調査結果を記録..."
                  rows={3}
                />
              </div>

              {/* ペナルティ適用 */}
              {newStatus === 'resolved' && (
                <div className="flex items-center space-x-2 p-3 border border-red-200 bg-red-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="apply-penalty"
                    checked={applyPenalty}
                    onChange={(e) => setApplyPenalty(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="apply-penalty" className="text-sm text-red-900 cursor-pointer">
                    <strong>ペナルティを適用</strong>（対象ユーザーの回答数を1減らす）
                  </label>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateReport} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                '更新'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

