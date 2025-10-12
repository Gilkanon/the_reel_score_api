import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import {
  ApiResponse,
  Credits,
  MovieDetails,
  TvShowDetails,
} from './interfaces/tmdb.interfaces';
import SearchResultDto from './dto/search-movie.dto';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  //Move to media controller later
  @Get('/movie/trending')
  async getTrendingMovies(): Promise<ApiResponse<SearchResultDto>> {
    const movies = await this.tmdbService.getTrendingMovies();

    return movies;
  }

  //Move to media controller later
  @Get('/tv/trending')
  async getTrendingTvShows(): Promise<ApiResponse<SearchResultDto>> {
    const tvShows = await this.tmdbService.getTrendingTvShows();

    return tvShows;
  }

  @Get('/movie/:id')
  async getMovieById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MovieDetails> {
    try {
      const movieData = await this.tmdbService.getMovieDetailsById(id);
      return movieData;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Get('/tv/:id')
  async getTvShowById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TvShowDetails> {
    const tvShowData = await this.tmdbService.getTvShowDetailsById(id);
    return tvShowData;
  }

  @Get('/movie/:id/credits')
  async getMovieCredits(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Credits> {
    const movieCredits = await this.tmdbService.getMovieCredits(id);
    return movieCredits;
  }

  @Get('/tv/:id/credits')
  async getTvShowCredits(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Credits> {
    const tvShowCredits = await this.tmdbService.getTvShowCredits(id);
    return tvShowCredits;
  }

  //Move to media controller later
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
