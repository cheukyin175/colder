import React, { useEffect, useState } from 'react';
import { Crown, Zap } from 'lucide-react';

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
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
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
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return '<1h';
    }
  };

  const creditPercentage = (creditInfo.credits / creditInfo.maxCredits) * 100;
  const isLowCredits = creditInfo.credits <= 2 && creditInfo.plan === 'FREE';

  return (
    <div className="flex items-center gap-3">
      {/* Credit Display */}
      <div className="flex items-center gap-1.5">
        <Zap className="h-4 w-4 text-gray-700" />
        <span className="text-sm font-medium text-gray-900">
          {creditInfo.credits}
          <span className="text-gray-500">/{creditInfo.maxCredits}</span>
        </span>
      </div>

      {/* Plan Badge */}
      {creditInfo.plan === 'PRO' ? (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-900 text-white text-xs font-semibold rounded-full">
          <Crown className="h-3 w-3" />
          PRO
        </div>
      ) : (
        <button
          onClick={onUpgradeClick}
          className="text-xs font-medium text-gray-900 hover:text-gray-700 underline underline-offset-2 transition-colors"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}