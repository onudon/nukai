import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserById } from "@/db";
import PointDisplay from "@/components/PointDisplay";
import TransferForm from "@/components/TransferForm";
import InviteForm from "@/components/InviteForm";
import { verifyJWT } from "@/utils/verify";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ error?: string; success?: string; }>
}) {
  const params = await searchParams;
  const cookie = await cookies();
  const token = cookie.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const userPayload = verifyJWT(token) as any;

  if (!userPayload || !userPayload.id) {
    redirect('/login');
  }

  // データベースから最新のユーザー情報を取得
  const currentUser = await getUserById(userPayload.id);
  // const allUsers = await getAllUsers();

  if (!currentUser) {
    redirect('/login');
  }

  // 自分以外のユーザーをフィルタリング
  // const otherUsers = allUsers.filter(u => u.id !== userPayload.id);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              こんにちは、{currentUser.name}さん
            </h1>
            <p className="text-gray-600">学生ID: {currentUser.sois_id}</p>
          </div>

          {/* メッセージ表示 */}
          {params.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    {params.success === 'transfer_completed' && 'ポイントの送金が完了しました！'}
                    {params.success === 'invite_completed' && '友達の招待が完了しました！友達がログイン時にあなたに1000ポイントが加算されます。'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {params.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {params.error === 'invalid_data' && '入力データが無効です。'}
                    {params.error === 'invalid_sois_id' && '学生IDは6桁の数字である必要があります。'}
                    {params.error === 'same_user' && '自分自身に送金することはできません。'}
                    {params.error === 'user_not_found' && 'ユーザーが見つかりません。'}
                    {params.error === 'insufficient_points' && 'ポイントが不足しています。'}
                    {params.error === 'recipient_not_found' && '送金先のユーザーが見つかりません。'}
                    {params.error === 'transfer_failed' && '送金処理でエラーが発生しました。'}
                    {params.error === 'invalid_invite_data' && '招待データが無効です。'}
                    {params.error === 'invalid_invite_sois_id' && '招待する学生IDは6桁の数字である必要があります。'}
                    {params.error === 'invalid_invite_name' && '招待する人の名前が無効です。'}
                    {params.error === 'invite_user_exists' && 'その学生IDのユーザーは既に存在します。'}
                    {params.error === 'invite_failed' && '招待処理でエラーが発生しました。'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ポイント表示 */}
          <PointDisplay points={currentUser.point} />

          {/* シラバス自動登録ページへのリンク */}
          <div className="mt-8 text-center">
            <a 
              href="/reg" 
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              シラバス自動登録ページ
            </a>
          </div>

          {/* 送金フォーム */}
          <div className="mt-8">
            <TransferForm 
              currentUserId={userPayload.id} 
              // users={otherUsers}
              currentUserPoints={currentUser.point}
            />
          </div>

          {/* 招待フォーム */}
          <div className="mt-8">
            <InviteForm currentUserId={userPayload.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
