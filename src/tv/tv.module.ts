import { Module } from '@nestjs/common';
import { TvController } from './tv.controller';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { TmdbModule } from 'src/tmdb/tmdb.module';

@Module({
  controllers: [TvController],
  imports: [ReviewsModule, TmdbModule],
})
export class TvModule {}
