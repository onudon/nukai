'use client';

import { SClass } from "@/db";
import { useState } from "react";

interface ClassSelectionFormProps {
    availableClasses: SClass[];
    userId: string;
    initialSelectedClasses: number[];
}

export default function ClassSelectionForm({ availableClasses, userId, initialSelectedClasses }: ClassSelectionFormProps) {
    const [selectedClasses, setSelectedClasses] = useState<number[]>(initialSelectedClasses);
    const [isLoading, setIsLoading] = useState(false);
    const [popupTestStatus, setPopupTestStatus] = useState<'not-tested' | 'blocked' | 'allowed'>('not-tested');
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const testPopup = () => {
        try {
            const testWindows = [];
            let blockedCount = 0;

            // 3つのポップアップを試す
            for (let i = 0; i < 3; i++) {
                const testWindow = window.open('', '_blank', 'width=1,height=1');
                if (testWindow) {
                    testWindows.push(testWindow);
                } else {
                    blockedCount++;
                }
            }

            // 開いたウィンドウを閉じる
            testWindows.forEach(window => {
                if (window) {
                    window.close();
                }
            });

            // 結果判定
            if (blockedCount === 0) {
                setPopupTestStatus('allowed');
                alert(`ポップアップが許可されています！(3/3 成功)\nシラバス自動登録を実行できます。`);
            } else {
                setPopupTestStatus('blocked');
                alert(`ポップアップがブロックされています。(${3 - blockedCount}/3)\nブラウザ設定でポップアップを許可してください。`);
            }
        } catch (error) {
            setPopupTestStatus('blocked');
            console.error('Popup test error:', error);
        }
    };

    const handleCheckboxChange = (classId: number, isChecked: boolean) => {
        if (isChecked) {
            setSelectedClasses(prev => [...prev, classId]);
        } else {
            setSelectedClasses(prev => prev.filter(id => id !== classId));
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/save-classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    selectedClasses
                })
            });

            if (response.ok) {
                alert('授業の選択が保存されました！');
            } else {
                alert('保存に失敗しました。');
            }
        } catch (error) {
            alert('エラーが発生しました。');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendToSyllabus = async (link: string) => {
        // ブラウザ環境でのみ実行
        if (typeof window === 'undefined') return;

        const courses = selectedClasses; // 選択された授業IDを使用

        try {
            // より安全なDOM操作
            const form = document.querySelector('form[name="formRegist"]') as HTMLFormElement;
            const courseIdInput = document.querySelector('input[name="CourseID"]') as HTMLInputElement;

            const loginForm = document.querySelector('form[name="login_form"]') as HTMLFormElement;
            const idInput = document.querySelector('input[name="TXT_ST_ID"]') as HTMLInputElement;
            const passwordInput = document.querySelector('input[name="TXT_ST_PW"]') as HTMLInputElement;

            if (!form || !courseIdInput) {
                console.error('Form or CourseID input not found');
                return;
            }

            // UIからパスワードを直接取得
            const uiPasswordInput = document.getElementById('syllabus-password-input') as HTMLInputElement;
            const currentPassword = uiPasswordInput ? uiPasswordInput.value : '';

            // フォームのactionを設定
            form.action = link;
            loginForm.action = link.replace('/schedule/prov', '/login/login/');
            idInput.value = userId;
            passwordInput.value = currentPassword;
            loginForm.submit();

            await new Promise(resolve => setTimeout(resolve, 500));

            for (let i = courses.length - 1; i >= 0; i--) {
                courseIdInput.value = courses[i].toString();
                form.submit();
                // 連続送信の間隔を空ける（オプション）
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    // 選択されていない授業と選択済み授業を分ける
    const unselectedClasses = availableClasses.filter(cls => !selectedClasses.includes(cls.id));
    const selectedClassesData = availableClasses.filter(cls => selectedClasses.includes(cls.id));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-center">授業選択</h1>

            {/* ポップアップ許可誘導UI */}
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.73 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-medium text-yellow-800">
                                シラバス自動登録にはポップアップ許可が必要です
                            </h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                自動登録時に大量のポップアップが開くため、事前にブラウザでポップアップを許可してください。
                            </p>
                        </div>
                    </div>
                    <div className="ml-4">
                        <button
                            onClick={testPopup}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        >
                            ポップアップテスト
                        </button>
                    </div>
                </div>

                {popupTestStatus === 'blocked' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center text-red-700">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="font-medium">ポップアップがブロックされています</span>
                        </div>
                        <p className="text-sm text-red-600 mt-2">
                            アドレスバーのポップアップアイコンをクリックして「許可」を選択するか、
                            ブラウザの設定でこのサイトのポップアップを許可してください。
                        </p>
                    </div>
                )}

                {popupTestStatus === 'allowed' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-700">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">ポップアップが許可されています！</span>
                        </div>
                        <p className="text-sm text-green-600 mt-1">
                            シラバス自動登録を実行できます。
                        </p>
                    </div>
                )}
            </div>

            {/* パスワード入力フィールド */}
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                        <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-blue-800 mb-2">
                                シラバスログイン用パスワード
                            </h3>
                            <div className="relative w-full max-w-md">
                                <input
                                    id="syllabus-password-input"
                                    type={showPassword ? "text" : "password"}
                                    defaultValue=""
                                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="シラバスのパスワードを入力"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-blue-600 mt-1">
                                自動登録時にシラバスサイトへログインするために使用されます
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 h-[600px]">
                {/* 左側: 選択可能な授業 */}
                <div className="flex-1 border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">選択可能な授業</h2>
                    <div className="space-y-2 overflow-y-auto h-[calc(100%-2rem)]">
                        {unselectedClasses.map((cls: SClass) => (
                            <div
                                key={cls.id}
                                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleCheckboxChange(cls.id, true)}
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{cls.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {cls.timetable} - {cls.days} ({cls.section}限)
                                        {cls.registed_max && ` | 定員: ${cls.registed_max}名`}
                                    </div>
                                </div>
                                <button
                                    className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCheckboxChange(cls.id, true);
                                    }}
                                >
                                    選択
                                </button>
                            </div>
                        ))}
                        {unselectedClasses.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                すべての授業が選択されています
                            </div>
                        )}
                    </div>
                </div>

                {/* 右側: 選択済み授業とSaveボタン */}
                <div className="flex-1 border rounded-lg p-4 bg-blue-50">
                    <h2 className="text-lg font-semibold mb-4 text-blue-700">選択済み授業</h2>
                    <div className="space-y-2 overflow-y-auto h-[calc(100%-8rem)]">
                        {selectedClassesData.map((cls: SClass) => (
                            <div
                                key={cls.id}
                                className="flex items-center p-3 border rounded-lg bg-white hover:bg-gray-50"
                            >
                                <div className="flex-1">
                                    <div className="font-medium">{cls.name}</div>
                                    <div className="text-sm text-gray-600">
                                        {cls.timetable} - {cls.days} ({cls.section}限)
                                        {cls.registed_max && ` | 定員: ${cls.registed_max}名`}
                                    </div>
                                </div>
                                <button
                                    className="ml-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                    onClick={() => handleCheckboxChange(cls.id, false)}
                                >
                                    削除
                                </button>
                            </div>
                        ))}
                        {selectedClassesData.length === 0 && (
                            <div className="text-center text-gray-500 py-8">
                                授業を選択してください
                            </div>
                        )}
                    </div>

                    {/* 下部の情報とSaveボタン */}
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-sm text-blue-700 mb-3">
                            {selectedClasses.length}個の授業が選択されています
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isLoading || selectedClasses.length === 0}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                        >
                            {isLoading ? '保存中...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-4 max-w-md mx-auto">
                <button
                    onClick={() => sendToSyllabus('https://sis-syllabus.kwansei.ac.jp/stg/app/student/web/schedule/prov')}
                    disabled={isLoading || selectedClasses.length === 0}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                    シミュレーションに挿入
                </button>
                <button
                    onClick={() => sendToSyllabus('https://sis-syllabus.kwansei.ac.jp/student/schedule/prov')}
                    disabled={isLoading || selectedClasses.length === 0}
                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                    本番シラバスに挿入
                </button>
            </div>

            <div>
                <form name="formRegist" action="" method="post" target="_blank">
                    <input type="hidden" name="CourseID" value="" />
                </form>
            </div>
            <div>
                <form action="" method="post" name="login_form" id="login_form" target="_blank">
                    <input id="login_pass" type="hidden" name="TXT_ST_ID"></input>
                    <input id="login_pass" type="hidden" name="TXT_ST_PW"></input>
                </form>
            </div>
        </div>
    );
}