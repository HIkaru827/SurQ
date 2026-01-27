# アンケート有効期限システム

## 📋 概要

アンケートには**1か月の有効期限**があり、期限が切れると自動的に終了（非公開化）されます。
ただし、**月1回他のアンケートに回答すると、自分の全アンケートの有効期限が1か月延長**されます。

この仕組みにより、アクティブなユーザーのアンケートは継続的に公開され、コミュニティの活性化を促進します。

## 🎯 主な機能

### 1. 自動有効期限設定
- アンケート作成時に、自動的に**1か月後**の有効期限が設定されます
- 有効期限は `expires_at` フィールドに保存されます

### 2. 自動延長システム
- **トリガー**: 他のユーザーのアンケートに回答したとき
- **効果**: 自分の全公開アンケートの有効期限が**自動的に1か月延長**
- **制限**: なし（回答するたびに延長されます）
- **メリット**: アクティブなユーザーのアンケートは半永久的に公開可能

### 3. 自動終了
- 有効期限が切れたアンケートは自動的に非公開化されます
- 定期的なチェック処理により、期限切れアンケートが検出されます

### 4. UI通知
- **有効期限バッジ**: アンケート一覧に残り日数を表示
- **警告通知**: 有効期限が7日以内のアンケートに警告表示
- **延長ステータス**: プロフィールページで延長状況を確認可能

## 🔧 実装詳細

### データベーススキーマ

#### surveys コレクション
```typescript
interface Survey {
  // ... 既存フィールド
  expires_at: Date          // 有効期限
  last_extended_at: Date    // 最後に延長した日時
  expired_at?: Date         // 期限切れ日時（終了後のみ）
}
```

#### users コレクション
```typescript
interface User {
  // ... 既存フィールド
  last_answered_at: Date              // 最後に回答した日時
  last_survey_extended_at: Date       // 最後にアンケート延長した日時
}
```

### API エンドポイント

#### POST /api/surveys
- アンケート作成時に有効期限を自動設定

#### POST /api/surveys/[id]/responses
- 回答時に以下を自動実行:
  1. 回答者の `surveys_answered` をインクリメント
  2. 回答者の `last_answered_at` を更新
  3. 回答者の全アンケートの有効期限を**自動的に**延長
  4. `last_survey_extended_at` を更新

#### POST /api/surveys/check-expiry
- 有効期限切れアンケートをチェックして自動終了
- Cron Job や定期実行タスクで呼び出す想定

#### GET /api/surveys/check-expiry
- 有効期限が近いアンケートの一覧を取得（管理用）

### ユーティリティ関数 (`lib/points.ts`)

```typescript
// 有効期限を計算（作成日から1か月）
calculateExpiryDate(createdAt: Date): Date

// 有効期限を延長（現在日から1か月）
extendExpiryDate(currentExpiry: Date): Date

// 期限切れかチェック
isExpired(expiryDate: Date): boolean

// 残り日数を計算
daysUntilExpiry(expiryDate: Date): number

// 有効期限が近いか（7日以内）
isExpiryApproaching(expiryDate: Date): boolean

// 今月回答したかチェック
hasAnsweredThisMonth(lastAnsweredAt: Date | null): boolean
```

## 📱 UI コンポーネント

### 1. アンケート一覧（/app）
- 有効期限バッジ表示:
  - 🟢 緑: 7日以上残っている
  - 🟡 黄: 7日以内
  - 🔴 赤: 期限切れ

### 2. プロフィールページ（/profile）

#### サイドバーカード
- **延長済み**: 緑色のカードで今月の延長完了を表示
- **延長可能**: 黄色のカードで延長可能を通知
- **警告**: 有効期限が近いアンケートをリスト表示

#### アンケートタブ
- トップに延長アラートを表示
- 各アンケートに有効期限バッジを表示

## 🚀 セットアップ

### 1. 既存アンケートへの有効期限追加

既存のアンケートには有効期限がないため、初回実行時に自動設定されます。

```bash
# 有効期限チェックAPIを実行
curl -X POST http://localhost:3000/api/surveys/check-expiry
```

### 2. 定期実行の設定（推奨）

#### Vercel Cron Jobs
`vercel.json` に以下を追加:

```json
{
  "crons": [
    {
      "path": "/api/surveys/check-expiry",
      "schedule": "0 0 * * *"
    }
  ]
}
```

#### GitHub Actions
`.github/workflows/check-expiry.yml`:

```yaml
name: Check Survey Expiry
on:
  schedule:
    - cron: '0 0 * * *'  # 毎日午前0時
  workflow_dispatch:

jobs:
  check-expiry:
    runs-on: ubuntu-latest
    steps:
      - name: Check Expired Surveys
        run: |
          curl -X POST https://your-domain.com/api/surveys/check-expiry
```

## 💡 使い方（ユーザー向け）

### アンケート作成者

1. **アンケートを作成**: 自動的に1か月の有効期限が設定されます
2. **自動延長**: 他のアンケートに回答すると、あなたの全アンケートが自動的に1か月延長されます
3. **回数制限なし**: 回答するたびに延長されるので、アクティブであればアンケートは継続公開されます
4. **確認**: プロフィールページで延長状況と有効期限を確認できます

### アンケート回答者

- アンケートに回答すると、作成者のアンケートの有効期限延長を手助けできます
- 自分がアンケートを作成している場合は、自分のアンケートも延長されます

## ⚙️ カスタマイズ

### 有効期限の変更

`lib/points.ts` の関数を編集:

```typescript
// 3か月に変更する場合
export function calculateExpiryDate(createdAt: Date): Date {
  const expiryDate = new Date(createdAt)
  expiryDate.setMonth(expiryDate.getMonth() + 3)  // 3に変更
  return expiryDate
}
```

### 警告日数の変更

```typescript
// 14日前から警告する場合
export function isExpiryApproaching(expiryDate: Date): boolean {
  const days = daysUntilExpiry(expiryDate)
  return days <= 14 && days > 0  // 14に変更
}
```

## 🔍 トラブルシューティング

### 既存アンケートに有効期限が表示されない

1. `/api/surveys/check-expiry` を実行して自動設定
2. Firestoreコンソールで `expires_at` フィールドを確認

### 延長が反映されない

1. ユーザーの `last_survey_extended_at` を確認
2. 今月既に延長済みでないか確認
3. ブラウザのキャッシュをクリア

### 有効期限切れアンケートが自動終了しない

1. Cron Jobが正しく設定されているか確認
2. 手動で `/api/surveys/check-expiry` を実行
3. サーバーログを確認

## 📊 統計・分析

### 延長率の確認

```typescript
// 延長したユーザーの割合
const usersWithExtension = await getDocs(
  query(
    collection(db, 'users'),
    where('last_survey_extended_at', '>=', startOfMonth)
  )
)
```

### 期限切れアンケート数

```typescript
// 期限切れで終了したアンケート数
const expiredSurveys = await getDocs(
  query(
    collection(db, 'surveys'),
    where('expired_at', '!=', null)
  )
)
```

## 🎓 ベストプラクティス

1. **定期的な回答**: 月初に1回アンケートに回答する習慣をつける
2. **期限管理**: プロフィールページで定期的に有効期限を確認
3. **早めの延長**: 有効期限が近づく前に延長しておく
4. **通知確認**: プロフィールページの延長ステータスカードを確認

## 🔐 セキュリティ

- 延長処理は認証されたユーザーのみ実行可能
- 回答者は自分のアンケートのみ延長可能
- 月1回の制限により不正延長を防止

## 📈 今後の拡張案

- [ ] メール通知: 有効期限が近づいたら通知
- [ ] プッシュ通知: モバイルアプリでの通知
- [ ] 延長履歴: 延長の履歴を表示
- [ ] 延長ストリーク: 連続延長月数のバッジ
- [ ] 自動延長: プレミアムユーザー向け機能

---

**作成日**: 2026年1月18日
**バージョン**: 1.0.0

