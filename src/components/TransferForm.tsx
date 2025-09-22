'use client';

import { useState } from 'react';
import { transferPoints } from '@/actions';


interface TransferFormProps {
    currentUserId: number;
    currentUserPoints: number;
}

export default function TransferForm({ currentUserId, currentUserPoints }: TransferFormProps) {
    const [soisId, setSoisId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!soisId || !amount) {
            alert('送金先の学生IDとポイント数を入力してください');
            return;
        }

        const soisIdNumber = parseInt(soisId);
        if (!soisIdNumber || soisIdNumber < 100000 || soisIdNumber > 999999) {
            alert('学生IDは6桁の数字である必要があります');
            return;
        }

        const transferAmount = parseInt(amount);
        if (transferAmount <= 0) {
            alert('1以上のポイントを入力してください');
            return;
        }

        if (transferAmount > currentUserPoints) {
            alert('ポイントが不足しています');
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('fromUserId', currentUserId.toString());
        formData.append('toSoisId', soisId);
        formData.append('amount', amount);
        formData.append('message', message);
        // var isError = false;
        await transferPoints(formData);
        setIsLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                ポイント送金
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 送金先入力 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        送金先の学生ID (6桁)
                    </label>
                    <input
                        type="number"
                        value={soisId}
                        onChange={(e) => setSoisId(e.target.value)}
                        min="100000"
                        max="999999"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例: 123456"
                        required
                    />
                </div>

                {/* 送金額入力 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        送金ポイント数
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            max={currentUserPoints}
                            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
                            placeholder="送金するポイント数"
                            required
                        />
                        <span className="absolute right-3 top-3 text-gray-500">pt</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        利用可能: {currentUserPoints.toLocaleString()} ポイント
                    </p>
                </div>

                {/* メッセージ */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        メッセージ (任意)
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="送金メッセージを入力してください"
                    />
                </div>

                {/* 送金ボタン */}
                <button
                    type="submit"
                    disabled={isLoading || !soisId || !amount}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            送金中...
                        </div>
                    ) : (
                        '送金する'
                    )}
                </button>
            </form>
        </div>
    );
}