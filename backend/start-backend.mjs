import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  const { default: helmet } = await import('helmet');
  const compression = (await import('compression')).default;
  const { IoAdapter } = await import('@nestjs/platform-socket.io');
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const { ValidationPipe } = await import('@nestjs/common');
  const { HttpExceptionFilter } = await import('./src/common/filters/http-exception.filter');
  const { TransformInterceptor } = await import('./src/common/interceptors/transform.interceptor');
  const { join } = await import('path');

  app.use(helmet.default ? helmet.default({ crossOriginResourcePolicy: { policy: 'cross-origin' } }) : helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());

  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HakimiVisa API').setDescription('Visa Management CRM API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`Health check at http://localhost:${port}/api/health/live`);
}

bootstrap().catch(err => {
  console.error('Backend failed to start:', err);
  process.exit(1);
});
