'use client';

interface PointDisplayProps {
  points: number;
}

export default function PointDisplay({ points }: PointDisplayProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">現在のポイント</h2>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="更新"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
      <div className="relative">
        <div className="text-8xl font-bold text-blue-600 mb-2">
          {points.toLocaleString()}
        </div>
        <div className="text-3xl font-medium text-gray-500">
          POINTS
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
          <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-blue-800 font-medium">利用可能</span>
        </div>
      </div>
    </div>
  );
}