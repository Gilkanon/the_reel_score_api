import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ApiResponse,
  Credits,
  Movie,
  MovieDetails,
  TvShow,
  TvShowDetails,
} from './interfaces/tmdb.interfaces';
import { plainToInstance } from 'class-transformer';
import SearchResultDto from './dto/search-movie.dto';
import { AxiosRequestConfig } from 'axios';
import { AxiosError } from 'axios';

@Injectable()
export class TmdbService {
  private readonly accessToken: string;
  // private readonly imagePath: string;
  private readonly baseUrl: string;
  private readonly requestOptions: AxiosRequestConfig;

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {
    this.accessToken = this.config.getOrThrow<string>('API_ACCESS_TOKEN');
    // this.imagePath = this.config.getOrThrow('IMAGE_PATH');
    this.baseUrl = this.config.getOrThrow('TMDB_BASE_URL');
    this.requestOptions = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    };
  }

  private async handleRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (error instanceof AxiosError) {
        throw error;
      }

      console.error('Unexpected runtime error in TMDbService:', error);
      throw new InternalServerErrorException(
        'Internal error processing data from external API.',
      );
    }
  }

  private async fetchAndTransformPaginated<TSource, TDestination>(
    url: string,
    dtoClass: new (...args: any[]) => TDestination,
  ): Promise<ApiResponse<TDestination>> {
    const { data } = await firstValueFrom(
      this.httpService.get<ApiResponse<TSource>>(url, this.requestOptions),
    );
    const simplifiedData = data.results.map((content) =>
      plainToInstance(dtoClass, content),
    );
    return {
      page: data.page,
      results: simplifiedData,
      total_pages: data.total_pages,
      total_results: data.total_results,
    };
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.append('language', 'en-US');

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  async getMovieDetailsById(movieId: number): Promise<MovieDetails> {
    const url = this.buildUrl(`/movie/${movieId}`);

    return this.handleRequest(async () => {
      const { data } = await firstValueFrom(
        this.httpService.get<MovieDetails>(url, this.requestOptions),
      );
      return data;
    });
  }

  async getMovieCredits(movieId: number): Promise<Credits> {
    const url = this.buildUrl(`/movie/${movieId}/credits`);

    return this.handleRequest(async () => {
      const { data } = await firstValueFrom(
        this.httpService.get<Credits>(url, this.requestOptions),
      );

      return data;
    });
  }

  async searchMovies(
    query: string,
    page: number,
  ): Promise<ApiResponse<SearchResultDto>> {
    const url = this.buildUrl('/search/movie', {
      query: query,
      include_adult: 'false',
      page: page,
    });

    return this.handleRequest(async () => {
      return this.fetchAndTransformPaginated<Movie, SearchResultDto>(
        url,
        SearchResultDto,
      );
    });
  }

  async getTrendingMovies(): Promise<ApiResponse<SearchResultDto>> {
    const url = this.buildUrl('/trending/movie/day');

    return this.handleRequest(async () => {
      return this.fetchAndTransformPaginated<Movie, SearchResultDto>(
        url,
        SearchResultDto,
      );
    });
  }

  async getTvShowDetailsById(tvShowId: number): Promise<TvShowDetails> {
    const url = this.buildUrl(`/tv/${tvShowId}`);

    return this.handleRequest(async () => {
      const { data } = await firstValueFrom(
        this.httpService.get<TvShowDetails>(url, this.requestOptions),
      );

      return data;
    });
  }

  async getTvShowCredits(tvShowId: number): Promise<Credits> {
    const url = this.buildUrl(`/tv/${tvShowId}/credits`);

    return this.handleRequest(async () => {
      const { data } = await firstValueFrom(
        this.httpService.get<Credits>(url, this.requestOptions),
      );

      return data;
    });
  }

  async searchTvShows(
    query: string,
    page: number,
  ): Promise<ApiResponse<SearchResultDto>> {
    const url = this.buildUrl('/search/tv', {
      query: query,
      include_adult: 'false',
      page: page,
    });

    return this.handleRequest(async () => {
      return this.fetchAndTransformPaginated<TvShow, SearchResultDto>(
        url,
        SearchResultDto,
      );
    });
  }

  async getTrendingTvShows(): Promise<ApiResponse<SearchResultDto>> {
    const url = this.buildUrl('/trending/tv/day');

    return this.handleRequest(async () => {
      return this.fetchAndTransformPaginated<TvShow, SearchResultDto>(
        url,
        SearchResultDto,
      );
    });
  }
}
