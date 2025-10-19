import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TmdbService } from 'src/tmdb/tmdb.service';

@Controller('media')
export class MediaController {
  constructor(private readonly tmdbService: TmdbService) {}

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
