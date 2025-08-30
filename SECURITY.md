# SurQ セキュリティガイド

## セキュリティ実装状況

### ✅ 実装済みのセキュリティ対策

#### 1. 認証・認可システム
- **Firebase Admin SDK認証**: 全てのAPI エンドポイントでIDトークン検証
- **認証ミドルウェア**: `withAuth()` ラッパーで統一的な認証処理
- **認可チェック**: リソースの所有者検証
- **管理者権限**: 環境変数ベースの管理者アカウント管理

#### 2. 入力検証・データ検証
- **Zodスキーマ検証**: 全ての入力データの厳密な型チェック
- **サニタイゼーション**: XSS対策のための文字列処理
- **業務ロジック検証**: ポイント不足チェック、重複処理防止

#### 3. セキュリティヘッダー
- **X-Frame-Options**: クリックジャッキング防止
- **X-Content-Type-Options**: MIME タイプスニッフィング防止
- **X-XSS-Protection**: XSS 保護
- **Content-Security-Policy**: コンテンツ実行制限
- **Referrer-Policy**: リファラー情報制限

#### 4. 設定セキュリティ
- **TypeScript strict mode**: 型安全性の強化
- **環境変数管理**: 機密情報の環境変数化
- **開発/本番環境分離**: 設定の適切な分離

#### 5. 業務ロジック保護
- **トランザクション処理**: クーポン重複利用防止
- **レート制限基盤**: オリジン検証機能
- **エラー処理統一**: 情報漏洩防止

## API 認証の使用方法

### フロントエンドでの認証トークン送信

```typescript
// Firebase認証トークンを取得してAPI呼び出し
import { auth } from '@/lib/firebase'

const callSecureAPI = async () => {
  if (!auth?.currentUser) {
    throw new Error('Not authenticated')
  }
  
  const token = await auth.currentUser.getIdToken()
  
  const response = await fetch('/api/surveys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'New Survey',
      questions: [...],
      // ...
    })
  })
  
  return response.json()
}
```

### サーバーサイドでの認証チェック

```typescript
// 認証が必要なAPI エンドポイント
import { withAuth } from '@/lib/auth-middleware'

export const POST = withAuth(async (request, user) => {
  // user.email でユーザー情報にアクセス可能
  // 自動的に認証済み状態が保証される
  
  // リソース所有者チェックの例
  if (user.email !== requestData.ownerEmail) {
    return createErrorResponse('Unauthorized', 403)
  }
  
  // 処理続行...
})
```

## 環境変数設定

### 必須セキュリティ設定

```bash
# .env.local
# 管理者メールアドレス（カンマ区切りで複数指定可能）
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# 許可するオリジン
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# JWT署名用秘密鍵（本番環境では必ず変更）
JWT_SECRET=your-secure-jwt-secret-here

# クーポン設定（code:points:description 形式）
VALID_COUPONS=WELCOME2025:200:ウェルカムボーナス,BONUS100:100:ボーナスポイント
```

## セキュリティベストプラクティス

### 本番環境デプロイ前チェックリスト

- [ ] 全ての API エンドポイントに認証が実装されている
- [ ] 管理者メールが環境変数で設定されている
- [ ] JWT_SECRET が強固なランダム文字列に設定されている
- [ ] ALLOWED_ORIGINS が本番ドメインに限定されている
- [ ] Firebase Admin SDK サービスアカウントキーが適切に設定されている
- [ ] デバッグログが本番環境で無効化されている
- [ ] セキュリティヘッダーが適切に設定されている

### 継続的セキュリティ対策

#### 推奨追加実装
1. **レート制限**: API呼び出し頻度制限
2. **監査ログ**: セキュリティイベントのログ記録
3. **セッション管理**: トークン有効期限の適切な管理
4. **暗号化**: 機密データの暗号化
5. **脆弱性スキャン**: 定期的な依存関係チェック

#### 監視項目
- 異常な認証失敗の増加
- 不正なAPI アクセスパターン
- リソース所有者検証の失敗
- 大量のポイント消費活動

## トラブルシューティング

### よくある認証エラー

#### "Authentication required" エラー
```typescript
// 原因: Authorization ヘッダーが不正または欠如
// 解決: 正しいBearerトークンを設定
headers: {
  'Authorization': `Bearer ${await user.getIdToken()}`
}
```

#### "Invalid or expired token" エラー
```typescript
// 原因: トークンの有効期限切れ
// 解決: トークンを再取得
const token = await user.getIdToken(true) // 強制更新
```

#### "Forbidden: Email mismatch" エラー
```typescript
// 原因: 認証されたユーザーと要求されたリソースの不一致
// 解決: ユーザー確認後に適切なリソースにアクセス
```

## セキュリティ連絡先

セキュリティ上の問題を発見した場合は、以下の手順で報告してください：

1. **重大な脆弱性**: 直接開発者に連絡
2. **一般的な問題**: GitHub Issues で報告
3. **設定関連**: このドキュメントを参照

## 更新履歴

- **v1.0.0** (2025-08-30): 初期セキュリティ実装
  - Firebase Admin SDK認証
  - 入力検証システム
  - セキュリティヘッダー設定
  - 環境変数セキュリティ対策