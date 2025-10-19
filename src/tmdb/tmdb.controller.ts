import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { Credits } from '../common/interfaces/tmdb.interfaces';

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
