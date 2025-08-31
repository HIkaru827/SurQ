'use client'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">SurQ利用規約</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">第1条 本規約の適用</h2>
            <p className="text-gray-700 leading-relaxed">
              本規約は、あなたが提供するWebアプリ「SurQ」（以下「本アプリ」）の利用に関する条件を定めるものです。利用者は、本規約に同意した上で、本アプリを利用するものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">第2条 禁止事項</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              利用者は、本アプリの利用にあたり、以下の行為を行ってはなりません。
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>本アプリの運営を妨害する行為</li>
              <li>虚偽の情報を登録または回答する行為</li>
              <li>他人の個人情報等を不正に収集、利用、公開する行為</li>
              <li>アンケートの回答を目的としない、不適切な投稿を行う行為</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">第3条 コンテンツの帰属</h2>
            <p className="text-gray-700 leading-relaxed">
              利用者が投稿したアンケートおよび回答データに関する著作権は、各投稿者に帰属します。ただし、投稿者は、本アプリのサービス提供に必要な範囲で、当社が当該コンテンツを利用（表示、分析、複製等）することを無償で許諾するものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">第4条 免責事項</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>本アプリは、提供情報の正確性、完全性、信頼性について、いかなる保証も行いません。</li>
              <li>本アプリの利用により生じた損害について、当社は一切の責任を負わないものとします。</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">第5条 利用の停止・削除</h2>
            <p className="text-gray-700 leading-relaxed">
              当社は、利用者が本規約に違反した場合、事前の通知なく当該利用者の利用を停止し、または登録情報を削除することができるものとします。
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