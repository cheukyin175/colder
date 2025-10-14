import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private readonly priceId: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
    this.priceId = this.configService.get<string>(
      'STRIPE_PRICE_ID',
      'price_default',
    );
  }

  /**
   * Create a Stripe checkout session for subscription
   */
  async createCheckoutSession(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
        },
      });
      stripeCustomerId = customer.id;

      // Save customer ID to database
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: this.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${this.configService.get('BACKEND_URL', 'http://localhost:3000')}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('BACKEND_URL', 'http://localhost:3000')}/stripe/cancel`,
      metadata: {
        userId: userId,
      },
    });

    return session;
  }

  /**
   * Create a Stripe customer portal session for managing subscription
   */
  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.stripeCustomerId) {
      throw new Error('No active subscription found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get('FRONTEND_URL')}/settings`,
    });

    return session;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    // Subscription might be a string ID or an expanded object
    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

    if (!subscriptionId) return;

    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    // Log the subscription to see its structure
    console.log('Subscription object:', JSON.stringify(subscription, null, 2));

    // Get the current period end date - try multiple possible field names
    const currentPeriodEnd = (subscription as any).current_period_end ||
                            (subscription as any).current_period?.end ||
                            (subscription as any).items?.data?.[0]?.current_period_end ||
                            Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // Default to 30 days from now

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscriptionEndDate: new Date(currentPeriodEnd * 1000),
        plan: Plan.PRO,
        credits: 500, // 500 messages per month for PRO users
      },
    });

    console.log(`User ${userId} upgraded to PRO plan`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customer = await this.prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    });

    if (!customer) return;

    // Get the current period end date
    const currentPeriodEnd = (subscription as any).current_period_end ||
                            (subscription as any).current_period?.end ||
                            (subscription as any).items?.data?.[0]?.current_period_end ||
                            Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);

    await this.prisma.user.update({
      where: { id: customer.id },
      data: {
        subscriptionStatus: subscription.status,
        subscriptionEndDate: new Date(currentPeriodEnd * 1000),
        plan: subscription.status === 'active' ? Plan.PRO : Plan.FREE,
        credits: subscription.status === 'active' ? 500 : 5,
      },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customer = await this.prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    });

    if (!customer) return;

    await this.prisma.user.update({
      where: { id: customer.id },
      data: {
        subscriptionStatus: 'canceled',
        plan: Plan.FREE,
        credits: 5,
        stripeSubscriptionId: null,
      },
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Get user from customer ID since invoice doesn't have metadata
    const customer = await this.prisma.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!customer) return;

    // payment_intent can be a string or an expanded object
    const paymentIntentId =
      typeof (invoice as any).payment_intent === 'string'
        ? (invoice as any).payment_intent
        : (invoice as any).payment_intent?.id;

    if (!paymentIntentId) return;

    await this.prisma.payment.create({
      data: {
        stripePaymentId: paymentIntentId,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        description: `Subscription payment for ${new Date(invoice.period_end * 1000).toLocaleDateString()}`,
        userId: customer.id,
      },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customer = await this.prisma.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string },
    });

    if (!customer) return;

    // Optionally notify user about failed payment
    await this.prisma.user.update({
      where: { id: customer.id },
      data: {
        subscriptionStatus: 'past_due',
      },
    });
  }

  /**
   * Get user subscription information
   */
  async getUserSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        credits: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
