// Vercel Serverless Function Adapter for NestJS
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');
const { AppModule } = require('../apps/backend/dist/app.module');

const server = express();

const createNestServer = async (expressInstance) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    { logger: ['error', 'warn'] }
  );

  app.enableCors({
    origin: true, // Allow all origins for Chrome extension
    credentials: true
  });

  await app.init();
  return app;
};

let appPromise;

module.exports = async (req, res) => {
  if (!appPromise) {
    appPromise = createNestServer(server);
  }

  await appPromise;
  server(req, res);
};