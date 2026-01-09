# SurQ ローカル開発環境セットアップ

## 必要な環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください。

### Firebase設定（必須）

Firebase Console (https://console.firebase.google.com/) からプロジェクト設定を取得してください。

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### Firebase Admin SDK（サーバーサイド用、オプション）

APIルートで認証が必要な場合に使用します。

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### その他のオプション設定

```env
# Google Analytics（オプション）
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# 管理者設定（オプション）
ADMIN_EMAILS=admin@example.com,admin2@example.com
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3007,https://surq.net

# プッシュ通知（オプション）
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# クーポンコード（オプション）
VALID_COUPONS=COUPON1,COUPON2
```

## 開発サーバーの起動

```bash
pnpm dev
```

デフォルトで `http://localhost:3000` で起動します。

## Firebase設定の取得方法

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. プロジェクト設定（⚙️アイコン）→ 全般タブ
4. 「マイアプリ」セクションでWebアプリを追加（または既存のアプリを選択）
5. 設定値（apiKey, authDomain, projectId など）をコピーして `.env.local` に設定

## 注意事項

- `.env.local` ファイルは `.gitignore` に含まれているため、Gitにはコミットされません
- Firebase設定がない場合、アプリは起動しますが、認証やデータベース機能は動作しません
- 開発環境では、Firebase設定がなくてもUIの確認は可能です


