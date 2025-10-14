import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check and reset credits for a user if needed
   */
  async checkAndResetCredits(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return user;

    const now = new Date();
    const lastReset = new Date(user.lastCreditReset);

    // For PRO users, reset to 500 credits at the start of each billing cycle
    if (user.plan === Plan.PRO) {
      // Check if we're in a new billing cycle (monthly)
      const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceReset >= 30) {
        return await this.prisma.user.update({
          where: { id: userId },
          data: {
            credits: 500,
            lastCreditReset: now,
          },
        });
      }
      return user;
    }

    // For FREE users, check if 24 hours have passed since last reset
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      // Reset credits to 5 for free users
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          credits: 5,
          lastCreditReset: now,
        },
      });
    }

    return user;
  }

  /**
   * Cron job to reset credits for all free users at midnight
   * Runs every day at 00:00
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCreditReset() {
    console.log('Running daily credit reset for free users...');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset credits for all free users who haven't been reset in the last 24 hours
    const result = await this.prisma.user.updateMany({
      where: {
        plan: Plan.FREE,
        lastCreditReset: {
          lte: yesterday,
        },
      },
      data: {
        credits: 5,
        lastCreditReset: new Date(),
      },
    });

    console.log(`Reset credits for ${result.count} free users`);
  }

  /**
   * Deduct credits from a user
   */
  async deductCredits(userId: string, amount: number = 1) {
    const user = await this.checkAndResetCredits(userId);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.credits < amount) {
      throw new Error('Insufficient credits');
    }

    // Deduct credits for both FREE and PRO users
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });
  }

  /**
   * Get user credit information
   */
  async getUserCredits(userId: string) {
    const user = await this.checkAndResetCredits(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const nextResetTime = user.plan === Plan.FREE
      ? new Date(user.lastCreditReset.getTime() + 24 * 60 * 60 * 1000)
      : new Date(user.lastCreditReset.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      credits: user.credits,
      plan: user.plan,
      isUnlimited: false, // No longer unlimited for PRO users
      maxCredits: user.plan === Plan.PRO ? 500 : 5,
      nextResetTime,
    };
  }
}