import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Frontend'in (tarayıcının) API'ye istek atmasına izin veriyoruz (CORS)
  app.enableCors(); 

  await app.listen(3000);
}
bootstrap();