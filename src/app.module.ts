import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TmdbModule } from './tmdb/tmdb.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MoviesModule } from './movies/movies.module';
import { TvModule } from './tv/tv.module';
import { MediaModule } from './media/media.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from './mail/mail.module';
import { CronModule } from './cron/cron.module';
import { ScheduleModule } from '@nestjs/schedule';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TmdbModule,
    ReviewsModule,
    MoviesModule,
    TvModule,
    MediaModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            new KeyvRedis(
              new URL(
                `redis://${config.getOrThrow('REDIS_HOST')}:${config.getOrThrow('REDIS_PORT')}`,
              ),
            ),
          ],
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return {
          connection: {
            host: config.getOrThrow('REDIS_HOST'),
            port: Number(config.getOrThrow('REDIS_PORT')),
          },
          prefix: 'bull',
        };
      },
      inject: [ConfigService],
    }),
    MailModule,
    ScheduleModule.forRoot(),
    CronModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        throttlers: [{ limit: 20, ttl: seconds(10) }],
        storage: new ThrottlerStorageRedisService(
          `redis://${config.getOrThrow('REDIS_HOST')}:${config.getOrThrow('REDIS_PORT')}`,
        ),
      }),
    }),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
