import React, { useState } from 'react';

interface UpgradeModalProps {
  jwt: string | null;
  backendUrl: string;
  isOpen: boolean;
  onClose: () => void;
  currentPlan: 'FREE' | 'PRO';
}

export function UpgradeModal({ jwt, backendUrl, isOpen, onClose, currentPlan }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!jwt) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Open Stripe Checkout in new tab
      chrome.tabs.create({ url });

      // Set up a listener to refresh when returning to extension
      setTimeout(() => {
        window.location.reload();
      }, 5000); // Refresh after 5 seconds to update credits

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!jwt) {
      setError('Please sign in first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/stripe/create-portal-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to open subscription management');
      }

      const { url } = await response.json();

      // Open Customer Portal in new tab
      chrome.tabs.create({ url });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to open portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {currentPlan === 'FREE' ? 'Upgrade to Pro' : 'Manage Subscription'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {currentPlan === 'FREE' ? (
          <>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg mb-4">
                <h3 className="font-bold text-lg mb-2">Colder Pro</h3>
                <div className="text-2xl font-bold mb-1">$9.99/month</div>
                <div className="text-sm opacity-90">500 messages per month</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <div>
                    <div className="font-medium">100x More Messages</div>
                    <div className="text-sm text-gray-600">500 messages vs 5 per day</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <div>
                    <div className="font-medium">Priority Support</div>
                    <div className="text-sm text-gray-600">Get help when you need it</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <div>
                    <div className="font-medium">Advanced Features</div>
                    <div className="text-sm text-gray-600">Access to all message customizations</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <div>
                    <div className="font-medium">Cancel Anytime</div>
                    <div className="text-sm text-gray-600">No commitment, cancel whenever</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-xs text-gray-600">
                <strong>Current Plan:</strong> Free (5 messages/day)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Secure payment via Stripe. Cancel anytime.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg hover:from-purple-700 hover:to-blue-700 font-bold disabled:opacity-50 transition-all"
            >
              {loading ? 'Processing...' : 'Upgrade to Pro - $9.99/month'}
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Colder Pro</h3>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                    ACTIVE
                  </span>
                </div>
                <div className="text-sm opacity-90">500 messages per month</div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  Thank you for being a Pro subscriber! You have access to all premium features.
                </p>
                <p className="text-gray-600">
                  Manage your subscription, update payment method, or cancel anytime through Stripe's secure portal.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50"
              >
                {loading ? 'Opening Portal...' : 'Manage Subscription'}
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}