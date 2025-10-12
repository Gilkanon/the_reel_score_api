import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AxiosExceptionFilter } from './common/filters/axios-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AxiosExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
