import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig, loadConfig } from './config';

export async function createApp(config: AppConfig = loadConfig()): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config), {
    logger: config.APP_ENV === 'test' ? ['error'] : ['log', 'warn', 'error'],
  });
  // The API sits behind the web apps' proxy. Trust only a local proxy by default.
  app.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback');
  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  // No CORS: browsers reach the API only through the same-origin proxy of each web app.
  return app;
}
