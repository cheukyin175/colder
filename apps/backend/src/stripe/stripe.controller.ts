import {
  Controller,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  Body,
  Headers,
  HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Create a Stripe checkout session for subscription
   */
  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  async createCheckoutSession(@Req() req) {
    const userId = req.user.userId;
    const email = req.user.email;

    const session = await this.stripeService.createCheckoutSession(userId, email);
    return { url: session.url };
  }

  /**
   * Create a Stripe customer portal session for managing subscription
   */
  @Post('create-portal-session')
  @UseGuards(JwtAuthGuard)
  async createPortalSession(@Req() req) {
    const userId = req.user.userId;

    const session = await this.stripeService.createPortalSession(userId);
    return { url: session.url };
  }

  /**
   * Handle Stripe webhook events
   * Note: This endpoint needs the raw body, so it bypasses NestJS body parsing
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    try {
      if (!req.rawBody) {
        throw new Error('No raw body found in request');
      }
      const result = await this.stripeService.handleWebhook(
        signature,
        req.rawBody,
      );
      res.json(result);
    } catch (err: any) {
      console.error('Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  /**
   * Get current subscription status
   */
  @Get('subscription-status')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionStatus(@Req() req) {
    const userId = req.user.userId;

    const user = await this.stripeService.getUserSubscription(userId);
    return {
      plan: user.plan,
      status: user.subscriptionStatus,
      endDate: user.subscriptionEndDate,
      credits: user.credits,
    };
  }

  /**
   * Success page after Stripe checkout
   */
  @Get('success')
  async handleSuccess(@Res() res: Response) {
    // Return a simple HTML page that can close itself or redirect
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 {
            color: #10b981;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
            margin: 20px 0;
          }
          .checkmark {
            font-size: 60px;
            color: #10b981;
            margin-bottom: 20px;
          }
          button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
          button:hover {
            background: #4338ca;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">✓</div>
          <h1>Payment Successful!</h1>
          <p>Thank you for upgrading to Colder Pro!</p>
          <p>Your subscription is now active. You can close this tab and return to the extension.</p>
          <button onclick="window.close()">Close This Tab</button>
        </div>
        <script>
          // Try to close the tab after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;
    res.type('text/html').send(html);
  }

  /**
   * Cancel page if user cancels Stripe checkout
   */
  @Get('cancel')
  async handleCancel(@Res() res: Response) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Cancelled</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f3f4f6;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 {
            color: #ef4444;
            margin-bottom: 10px;
          }
          p {
            color: #6b7280;
            margin: 20px 0;
          }
          .icon {
            font-size: 60px;
            color: #ef4444;
            margin-bottom: 20px;
          }
          button {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
          button:hover {
            background: #4338ca;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✕</div>
          <h1>Payment Cancelled</h1>
          <p>Your payment was cancelled. No charges were made.</p>
          <p>You can close this tab and try again anytime from the extension.</p>
          <button onclick="window.close()">Close This Tab</button>
        </div>
        <script>
          // Try to close the tab after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;
    res.type('text/html').send(html);
  }
}