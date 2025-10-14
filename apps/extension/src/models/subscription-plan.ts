/**
 * Subscription Plan Model
 * Tracks user's subscription tier and feature access.
 */

import { PlanTier, PlanStatus, PLAN_LIMITS } from './types';

export interface SubscriptionPlan {
  // Identity
  userId: string;                // FK to UserProfile

  // Plan details
  plan: PlanTier;
  status: PlanStatus;

  // Billing
  purchasedAt: Date | null;
  expiresAt: Date | null;        // Null for free plan
  licenseKey: string | null;     // For paid plan activation

  // Feature flags
  features: PlanFeatures;

  // Usage tracking (for rate limiting)
  monthlyUsage: {
    messagesGenerated: number;
    resetDate: Date;
  };
}

export interface PlanFeatures {
  historyRetentionDays: number | null;  // Null = indefinite
  monthlyMessageLimit: number | null;   // Null = unlimited
  yoloModeEnabled: boolean;
  prioritySupport: boolean;
  customToneEnabled: boolean;           // Future feature
}

/**
 * Create a new subscription plan (defaults to free)
 */
export function createSubscriptionPlan(
  userId: string,
  plan: PlanTier = 'free'
): SubscriptionPlan {
  const now = new Date();
  const features = getFeaturesByPlan(plan);

  return {
    userId,
    plan,
    status: 'active',
    purchasedAt: plan === 'paid' ? now : null,
    expiresAt: null,
    licenseKey: null,
    features,
    monthlyUsage: {
      messagesGenerated: 0,
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) // First of next month
    }
  };
}

/**
 * Get features based on plan tier
 */
export function getFeaturesByPlan(plan: PlanTier): PlanFeatures {
  const limits = PLAN_LIMITS[plan];

  return {
    historyRetentionDays: limits.historyRetentionDays,
    monthlyMessageLimit: limits.monthlyMessageLimit,
    yoloModeEnabled: limits.yoloModeEnabled,
    prioritySupport: plan === 'paid',
    customToneEnabled: false // Future feature
  };
}

/**
 * Check if user has access to a specific feature
 */
export function hasFeatureAccess(
  subscription: SubscriptionPlan,
  feature: keyof PlanFeatures
): boolean {
  // Check if subscription is active
  if (subscription.status !== 'active' && subscription.status !== 'trial') {
    // Expired or cancelled subscriptions revert to free tier
    const freeFeatures = getFeaturesByPlan('free');
    return !!freeFeatures[feature];
  }

  return !!subscription.features[feature];
}

/**
 * Check if user has reached monthly message limit
 */
export function hasReachedMessageLimit(subscription: SubscriptionPlan): boolean {
  // Reset usage if needed
  const resetted = resetUsageIfNeeded(subscription);
  const sub = resetted || subscription;

  // No limit for paid plans
  if (sub.features.monthlyMessageLimit === null) {
    return false;
  }

  return sub.monthlyUsage.messagesGenerated >= sub.features.monthlyMessageLimit;
}

/**
 * Increment message usage count
 */
export function incrementMessageUsage(subscription: SubscriptionPlan): SubscriptionPlan {
  // Reset usage if needed
  const resetted = resetUsageIfNeeded(subscription);
  const sub = resetted || subscription;

  return {
    ...sub,
    monthlyUsage: {
      ...sub.monthlyUsage,
      messagesGenerated: sub.monthlyUsage.messagesGenerated + 1
    }
  };
}

/**
 * Reset usage if past reset date
 */
function resetUsageIfNeeded(subscription: SubscriptionPlan): SubscriptionPlan | null {
  const now = new Date();

  if (now >= subscription.monthlyUsage.resetDate) {
    return {
      ...subscription,
      monthlyUsage: {
        messagesGenerated: 0,
        resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
    };
  }

  return null;
}

/**
 * Validate license key format (simple validation for MVP)
 */
export function isValidLicenseKey(key: string): boolean {
  // Basic format: XXXX-XXXX-XXXX-XXXX
  const keyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return keyRegex.test(key);
}

/**
 * Upgrade to paid plan
 */
export function upgradeToPaid(
  subscription: SubscriptionPlan,
  licenseKey: string
): SubscriptionPlan {
  if (!isValidLicenseKey(licenseKey)) {
    throw new Error('Invalid license key format');
  }

  const now = new Date();
  const features = getFeaturesByPlan('paid');

  return {
    ...subscription,
    plan: 'paid',
    status: 'active',
    purchasedAt: now,
    expiresAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()), // 1 year
    licenseKey,
    features
  };
}

/**
 * Check if subscription has expired
 */
export function isSubscriptionExpired(subscription: SubscriptionPlan): boolean {
  if (subscription.plan === 'free') {
    return false; // Free plan never expires
  }

  if (!subscription.expiresAt) {
    return false;
  }

  return new Date() > subscription.expiresAt;
}

/**
 * Get remaining days in billing period
 */
export function getRemainingDays(subscription: SubscriptionPlan): number | null {
  if (!subscription.expiresAt) {
    return null;
  }

  const now = Date.now();
  const expiresAt = subscription.expiresAt.getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((expiresAt - now) / msPerDay));
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(subscription: SubscriptionPlan): string {
  if (subscription.plan === 'free') {
    const limit = subscription.features.monthlyMessageLimit;
    const used = subscription.monthlyUsage.messagesGenerated;
    return `Free Plan (${used}/${limit} messages this month)`;
  }

  const remainingDays = getRemainingDays(subscription);
  if (remainingDays !== null && remainingDays <= 30) {
    return `Paid Plan (expires in ${remainingDays} days)`;
  }

  return 'Paid Plan (Active)';
}