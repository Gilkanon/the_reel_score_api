import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { Credits } from '../common/interfaces/tmdb.interfaces';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { seconds, Throttle } from '@nestjs/throttler';

@Throttle({ tmdb: { limit: 30, ttl: seconds(60) } })
@UseInterceptors(CacheInterceptor)
@CacheTTL(60000)
@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

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
}
