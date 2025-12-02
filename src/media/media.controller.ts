import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { seconds, Throttle } from '@nestjs/throttler';

@Throttle({ media: { limit: 30, ttl: seconds(60) } })
@Controller('media')
export class MediaController {
  constructor(private readonly tmdbService: TmdbService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(3600000)
  @Get('/trending')
  async getTrendingMedia() {
    const [movies, tvShows] = await Promise.all([
      this.tmdbService.getTrendingMovies(),
      this.tmdbService.getTrendingTvShows(),
    ]);

    return {
      movies: movies,
      tvShows: tvShows,
    };
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60000)
  @Get('/search')
  async search(
    @Query('query') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
  ) {
    const [movieResults, tvShowsResult] = await Promise.all([
      this.tmdbService.searchMovies(query, page),
      this.tmdbService.searchTvShows(query, page),
    ]);

    return {
      movies: movieResults,
      tvShows: tvShowsResult,
    };
  }
}
