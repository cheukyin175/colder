import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for Stripe webhooks
  });

  // Enable CORS to allow requests from the frontend extension
  app.enableCors();

  await app.listen(3000);
  console.log('Backend is running on http://localhost:3000');
}
bootstrap();
