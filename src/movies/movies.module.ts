import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { ReviewsModule } from 'src/reviews/reviews.module';
import { TmdbModule } from 'src/tmdb/tmdb.module';

@Module({
  controllers: [MoviesController],
  imports: [ReviewsModule, TmdbModule],
})
export class MoviesModule {}
