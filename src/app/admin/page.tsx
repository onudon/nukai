import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/utils/verify";
import { JwtPayload } from "jsonwebtoken";
import { pool, User } from "@/db";
import { createUser } from "@/actions";

export default async function Admin({
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

    const user: JwtPayload = verifyJWT(token) as JwtPayload;

    if (!user) {
        redirect('/login');
    }

    // 管理者権限の確認 (perm が -1 から -5 の場合が管理者)
    const perm = Number(user.perm);
    if (!perm || perm > -1 || perm < -5) {
        redirect('/login');
    }

    // 全ユーザーの取得
    const [allUsers] = await pool.query<User[]>("SELECT id, sois_id, name, registered, perm FROM users ORDER BY id DESC");

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-4xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">管理者画面</h1>
                            <p className="text-gray-600">新しいユーザーの追加と既存ユーザーの管理</p>
                        </div>

                        {/* メッセージ表示 */}
                        {params.success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800">
                                            ユーザーが正常に作成されました。
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
                                            {params.error === 'invalid_id' && '学生IDは6桁の数字である必要があります。'}
                                            {params.error === 'invalid_name' && '氏名は1文字以上50文字以内で入力してください。'}
                                            {params.error === 'invalid_perm' && '権限レベルを正しく選択してください。'}
                                            {params.error === 'user_exists' && 'この学生IDは既に登録されています。'}
                                            {params.error === 'db_error' && 'データベースエラーが発生しました。'}
                                            {!['invalid_id', 'invalid_name', 'invalid_perm', 'user_exists', 'db_error'].includes(params.error) && '不明なエラーが発生しました。'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* 新規ユーザー追加セクション */}
                        <div className="mb-12 p-6 bg-blue-50 rounded-lg">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">新規ユーザー追加</h2>
                            <form action={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="sois_id" className="block text-sm font-medium text-gray-700 mb-2">
                                        学生ID (6桁)
                                    </label>
                                    <input
                                        type="number"
                                        id="sois_id"
                                        name="sois_id"
                                        min="100000"
                                        max="999999"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="123456"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                        氏名
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        maxLength={50}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="田中太郎"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="perm" className="block text-sm font-medium text-gray-700 mb-2">
                                        権限レベル
                                    </label>
                                    <select
                                        id="perm"
                                        name="perm"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">選択してください</option>
                                        <option value="0">一般ユーザー (0)</option>
                                        <option value="-1">管理者レベル1 (-1)</option>
                                        <option value="-2">管理者レベル2 (-2)</option>
                                        <option value="-3">管理者レベル3 (-3)</option>
                                        <option value="-4">管理者レベル4 (-4)</option>
                                        <option value="-5">管理者レベル5 (-5)</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        ユーザー作成
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        {/* ユーザー一覧セクション */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">登録済みユーザー一覧</h2>
                            <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                学生ID
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                氏名
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                登録状況
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                権限レベル
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {allUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                    登録されたユーザーがありません
                                                </td>
                                            </tr>
                                        ) : (
                                            allUsers.map((dbUser) => {
                                                const userPerm = Number(dbUser.perm);
                                                const isAdmin = userPerm >= -5 && userPerm <= -1;
                                                return (
                                                    <tr key={dbUser.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {dbUser.sois_id}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {dbUser.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                dbUser.registered 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {dbUser.registered ? '登録済み' : '未登録'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                isAdmin 
                                                                    ? 'bg-red-100 text-red-800' 
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {isAdmin ? `管理者 (${userPerm})` : `一般ユーザー (${userPerm})`}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
