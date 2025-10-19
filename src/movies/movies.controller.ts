import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ReviewDto } from 'src/common/dto/review.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { MovieDetails } from 'src/common/interfaces/tmdb.interfaces';
import { ReviewsService } from 'src/reviews/reviews.service';
import { TmdbService } from 'src/tmdb/tmdb.service';

@Controller('movies')
export class MoviesController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly tmdbService: TmdbService,
  ) {}

  @Get(':id')
  async getMovieById(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ movie: MovieDetails; reviews: ApiResponse<ReviewDto> }> {
    const [movieDetails, reviews] = await Promise.all([
      this.tmdbService.getMovieDetailsById(id),
      this.reviewsService.getReviewsByMediaId(id, paginationDto),
    ]);

    return {
      movie: movieDetails,
      reviews: {
        ...reviews,
        results: reviews.results.map((review) =>
          plainToInstance(ReviewDto, review),
        ),
      },
    };
  }
}
