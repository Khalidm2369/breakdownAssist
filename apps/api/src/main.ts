import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { json, urlencoded, raw } from 'express';
import cookieParser = require('cookie-parser'); // <-- CJS import that returns the function

async function bootstrap() {
  // We want a raw body for Stripe, so disable default body parser
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // 1) Stripe raw body FIRST
  app.use('/webhooks/stripe', raw({ type: 'application/json' }));

  // 2) Normal parsers for the rest
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true, limit: '2mb' }));

  // 3) Cookies
  app.use(cookieParser(process.env.COOKIE_SECRET || 'dev_secret'));

  // 4) CORS
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
