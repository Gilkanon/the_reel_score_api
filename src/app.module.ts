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
          new Keyv({ store: new CacheableMemory({ttl: 60000, lruSize: 5000})}),
          new KeyvRedis(config.getOrThrow('REDIS_URL'))
        ]
       }
      },
      inject: [ConfigService]
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
