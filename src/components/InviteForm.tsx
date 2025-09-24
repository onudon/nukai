'use client';

import { useState } from 'react';
import { inviteUser } from '@/actions';

interface InviteFormProps {
  currentUserId: number;
}

export default function InviteForm({ currentUserId }: InviteFormProps) {
  const [soisId, setSoisId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!soisId || !name) {
      alert('学生IDと氏名を入力してください');
      return;
    }

    const soisIdNumber = parseInt(soisId);
    if (!soisIdNumber || soisIdNumber < 100000 || soisIdNumber > 999999) {
      alert('学生IDは6桁の数字である必要があります');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('inviterUserId', currentUserId.toString());
    formData.append('soisId', soisId);
    formData.append('name', name);

    // Server Actionはredirectするのでtry-catchは不要
    setSoisId('');
    setName('');
    await inviteUser(formData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        友達を招待
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 学生ID入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            友達の学生ID (6桁)
          </label>
          <input
            type="number"
            value={soisId}
            onChange={(e) => setSoisId(e.target.value)}
            min="100000"
            max="999999"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="例: 123456"
            required
          />
        </div>

        {/* 氏名入力 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            友達の氏名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="例: 田中太郎"
            required
          />
        </div>

        {/* 招待ボタン */}
        <button
          type="submit"
          disabled={isLoading || !soisId || !name}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              招待中...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-8.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              友達を招待
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">招待について</p>
            <ul className="space-y-1">
              <li>• あなたのポイントが1000ポイント加算されます</li>
              <li>• 招待された友達はシステムに登録されます</li>
              <li>• 初回ログイン時にパスワードを設定します</li>
              <li>• 一般ユーザー権限で登録されます</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}