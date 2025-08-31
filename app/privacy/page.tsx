'use client'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">プライバシーポリシー</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed mb-6">
              SurQ（以下「本アプリ」）は、ユーザーの個人情報の保護に最大限の注意を払います。本プライバシーポリシーは、当サービスにおける個人情報の取り扱いについて定めたものです。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">1. 収集する情報</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本アプリは、以下の情報を収集します。
            </p>
            <p className="text-gray-700 leading-relaxed">
              利用者から直接提供される情報: ログイン情報（メールアドレス）、プロフィール情報（ユーザー名）、アンケートの回答内容、および投稿したアンケートの内容
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">2. 情報の利用目的</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              収集した情報は、以下の目的で利用します。
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>本アプリのサービス提供のため</li>
              <li>アンケートデータの集計、分析のため</li>
              <li>本アプリの改善および新機能開発のため</li>
              <li>利用規約に違反する行為への対応のため</li>
              <li>サービス改善・ユーザー動向分析（Google Analytics等による）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">3. 情報の管理と保護</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、収集した情報の漏洩、紛失、改ざんを防止するため、適切なセキュリティ対策を講じます。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">4. 情報の第三者提供</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、法令で認められる場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。ただし、アンケートの回答データは、個人が特定できない統計情報として、質問者および回答者に共有される場合があります。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">5. お問い合わせ</h2>
            <p className="text-gray-700 leading-relaxed">
              本プライバシーポリシーに関するご質問やお問い合わせは、hikarukose.work@gmailまでお願いします。
            </p>
          </section>

          <div className="mt-12 text-center">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}