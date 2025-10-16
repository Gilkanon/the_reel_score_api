import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AxiosExceptionFilter } from './common/filters/axios-exception.filter';
import { ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const reflector = new Reflector();
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));
  app.useGlobalFilters(new AxiosExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
