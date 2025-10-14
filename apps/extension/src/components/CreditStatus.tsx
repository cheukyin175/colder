import React, { useEffect, useState } from 'react';

interface CreditInfo {
  credits: number;
  plan: 'FREE' | 'PRO';
  maxCredits: number;
  nextResetTime: string;
  isUnlimited: boolean;
}

interface CreditStatusProps {
  jwt: string | null;
  backendUrl: string;
  onUpgradeClick: () => void;
}

export function CreditStatus({ jwt, backendUrl, onUpgradeClick }: CreditStatusProps) {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jwt) return;

    const fetchCreditInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${backendUrl}/credits/status`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });

        if (!response.ok) throw new Error("Failed to fetch credit info");

        const data = await response.json();
        setCreditInfo(data);
      } catch (error) {
        console.error("Error fetching credit info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditInfo();
    // Refresh credit info every 30 seconds
    const interval = setInterval(fetchCreditInfo, 30000);
    return () => clearInterval(interval);
  }, [jwt, backendUrl]);

  if (loading || !creditInfo) {
    return (
      <div className="px-4 py-2 bg-gray-100 border-b animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
    );
  }

  const formatResetTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'soon';
    }
  };

  const creditPercentage = (creditInfo.credits / creditInfo.maxCredits) * 100;
  const isLowCredits = creditInfo.credits <= 2 && creditInfo.plan === 'FREE';

  return (
    <div className={`px-4 py-3 border-b ${isLowCredits ? 'bg-yellow-50' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Credits: </span>
            <span className={`font-bold ${creditInfo.credits === 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {creditInfo.credits}/{creditInfo.maxCredits}
            </span>
          </div>
          {creditInfo.plan === 'PRO' && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-full">
              PRO
            </span>
          )}
        </div>

        {creditInfo.plan === 'FREE' && (
          <button
            onClick={onUpgradeClick}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
          >
            Upgrade to PRO
          </button>
        )}
      </div>

      {/* Credit Bar */}
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              creditInfo.credits === 0
                ? 'bg-red-500'
                : creditInfo.credits <= 2 && creditInfo.plan === 'FREE'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${creditPercentage}%` }}
          />
        </div>
      </div>

      {/* Reset Time */}
      <div className="mt-1 text-xs text-gray-500">
        {creditInfo.plan === 'FREE' ? (
          <>Daily reset in {formatResetTime(creditInfo.nextResetTime)}</>
        ) : (
          <>Monthly reset in {formatResetTime(creditInfo.nextResetTime)}</>
        )}
      </div>

      {/* Warning Messages */}
      {creditInfo.credits === 0 && (
        <div className="mt-2 p-2 bg-red-100 rounded-md">
          <p className="text-xs text-red-700">
            {creditInfo.plan === 'FREE' ? (
              <>No credits remaining. Upgrade to PRO for 500 messages/month or wait for daily reset.</>
            ) : (
              <>No credits remaining. Your credits will reset {formatResetTime(creditInfo.nextResetTime)}.</>
            )}
          </p>
        </div>
      )}

      {isLowCredits && (
        <div className="mt-2 p-2 bg-yellow-100 rounded-md">
          <p className="text-xs text-yellow-700">
            Running low on credits! Consider upgrading to PRO for 500 messages per month.
          </p>
        </div>
      )}
    </div>
  );
}