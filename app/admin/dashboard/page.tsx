"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { isDeveloperAccount } from '@/lib/developer'
import { authenticatedFetch } from '@/lib/api-client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Shield,
  Coins,
  Ban,
  CheckCircle,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  points: number
  surveys_answered: number
  surveys_created: number
  reportCount: number
  isBanned: boolean
  created_at: string
}

interface Summary {
  totalUsers: number
  todayRegistrations: number
  warningUsers: number
}

type SortField = 'reportCount' | 'name' | 'points' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalUsers: 0,
    todayRegistrations: 0,
    warningUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [pointsInput, setPointsInput] = useState('')
  const [pointsOperation, setPointsOperation] = useState<'add' | 'subtract' | 'set'>('add')
  const [updating, setUpdating] = useState(false)

  const isDevAccount = user?.email ? isDeveloperAccount(user.email) : false

  useEffect(() => {
    // 管理者チェック
    if (user && !isDevAccount) {
      router.push('/app')
      return
    }
    
    if (user) {
      fetchUsers()
    }
  }, [user, isDevAccount])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await authenticatedFetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setSummary(data.summary || { totalUsers: 0, todayRegistrations: 0, warningUsers: 0 })
      } else {
        console.error('Failed to fetch users:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === 'created_at') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const openUserDialog = (user: User) => {
    setSelectedUser(user)
    setPointsInput('')
    setPointsOperation('add')
    setIsDialogOpen(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setUpdating(true)
    try {
      const updates: any = {}
      
      if (pointsInput) {
        updates.points = parseInt(pointsInput) || 0
        updates.pointsOperation = pointsOperation
      }

      updates.isBanned = selectedUser.isBanned

      const response = await authenticatedFetch(`/api/admin/users`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: selectedUser.id,
          ...updates
        })
      })

      if (response.ok) {
        await fetchUsers()
        setIsDialogOpen(false)
        setSelectedUser(null)
      } else {
        const error = await response.json()
        alert(`更新に失敗しました: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('ユーザーの更新中にエラーが発生しました')
    } finally {
      setUpdating(false)
    }
  }

  const handleToggleBan = async () => {
    if (!selectedUser) return

    setUpdating(true)
    try {
      const response = await authenticatedFetch(`/api/admin/users`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: selectedUser.id,
          isBanned: !selectedUser.isBanned
        })
      })

      if (response.ok) {
        setSelectedUser({ ...selectedUser, isBanned: !selectedUser.isBanned })
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(`更新に失敗しました: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error toggling ban:', error)
      alert('アカウント凍結状態の更新中にエラーが発生しました')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user || !isDevAccount) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">管理者権限が必要です</p>
          <Link href="/app">
            <Button className="mt-4">ホームに戻る</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/app">
                <Button variant="ghost" size="sm">
                  戻る
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">管理者ダッシュボード</h1>
            </div>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
              <Shield className="w-4 h-4 mr-1" />
              管理者モード
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">総ユーザー数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-primary" />
                <div className="text-3xl font-bold">{summary.totalUsers}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">本日の新規登録者数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <UserPlus className="w-8 h-8 text-green-500" />
                <div className="text-3xl font-bold">{summary.todayRegistrations}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">要注意ユーザー数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div className="text-3xl font-bold">{summary.warningUsers}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">読み込み中...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 hover:text-primary"
                      >
                        <span>ユーザー名</span>
                        {sortField === 'name' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('points')}
                        className="flex items-center space-x-1 hover:text-primary"
                      >
                        <span>現在のポイント</span>
                        {sortField === 'points' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>回答数 (Give)</TableHead>
                    <TableHead>投稿数 (Take)</TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('reportCount')}
                        className="flex items-center space-x-1 hover:text-primary"
                      >
                        <span>通報数 (Reports)</span>
                        {sortField === 'reportCount' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center space-x-1 hover:text-primary"
                      >
                        <span>登録日</span>
                        {sortField === 'created_at' ? (
                          sortOrder === 'desc' ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openUserDialog(user)}
                    >
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span>{user.points.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.surveys_answered}</TableCell>
                      <TableCell>{user.surveys_created}</TableCell>
                      <TableCell>
                        {user.reportCount > 0 ? (
                          <Badge variant="destructive">{user.reportCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive">凍結中</Badge>
                        ) : (
                          <Badge variant="secondary">通常</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openUserDialog(user)
                          }}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* User Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ユーザー詳細: {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">現在のポイント</Label>
                  <div className="text-2xl font-bold flex items-center space-x-2 mt-1">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span>{selectedUser.points.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">ステータス</Label>
                  <div className="mt-1">
                    {selectedUser.isBanned ? (
                      <Badge variant="destructive" className="text-base px-3 py-1">
                        <Ban className="w-4 h-4 mr-1" />
                        凍結中
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        通常
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Points Management */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">ポイント管理</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label htmlFor="points">ポイント数</Label>
                    <Input
                      id="points"
                      type="number"
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      placeholder="数値を入力"
                    />
                  </div>
                  <div>
                    <Label htmlFor="operation">操作</Label>
                    <Select value={pointsOperation} onValueChange={(value: 'add' | 'subtract' | 'set') => setPointsOperation(value)}>
                      <SelectTrigger id="operation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">加算</SelectItem>
                        <SelectItem value="subtract">減算</SelectItem>
                        <SelectItem value="set">上書き</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleUpdateUser}
                  disabled={!pointsInput || updating}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    'ポイントを更新'
                  )}
                </Button>
              </div>

              {/* Ban Toggle */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">アカウント管理</h3>
                <Button
                  onClick={handleToggleBan}
                  disabled={updating}
                  variant={selectedUser.isBanned ? "default" : "destructive"}
                  className="w-full"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : selectedUser.isBanned ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      凍結を解除
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      アカウントを凍結
                    </>
                  )}
                </Button>
              </div>

              {/* Activity Log */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">直近の行動ログ</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {/* ダミーデータ */}
                  <div className="text-sm p-2 bg-muted rounded">
                    2024-01-15: アンケート回答
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    2024-01-14: アンケート作成
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    2024-01-13: アンケート回答
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    2024-01-12: ログイン
                  </div>
                  <div className="text-sm p-2 bg-muted rounded">
                    2024-01-11: アンケート回答
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


