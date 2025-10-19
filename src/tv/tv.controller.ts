import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ReviewDto } from 'src/common/dto/review.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { TvShowDetails } from 'src/common/interfaces/tmdb.interfaces';
import { ReviewsService } from 'src/reviews/reviews.service';
import { TmdbService } from 'src/tmdb/tmdb.service';

@Controller('tv')
export class TvController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly tmdbService: TmdbService,
  ) {}

  @Get('/:id')
  async getTvShowById(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ tvShow: TvShowDetails; reviews: ApiResponse<ReviewDto> }> {
    const [tvShow, reviews] = await Promise.all([
      this.tmdbService.getTvShowDetailsById(id),
      this.reviewsService.getReviewsByMediaId(id, paginationDto),
    ]);

    return {
      tvShow: tvShow,
      reviews: {
        ...reviews,
        results: reviews.results.map((review) =>
          plainToInstance(ReviewDto, review),
        ),
      },
    };
  }
}
