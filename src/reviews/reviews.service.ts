import {
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, Review, Media, Role } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { getPaginationParams } from 'src/common/utils/pagination.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { UsersService } from 'src/users/users.service';
import { CreateMediaDto } from './dto/media/create-media.dto';
import { CreateReviewDto } from './dto/review/create-review.dto';
import {
  MovieDetails,
  TvShowDetails,
} from 'src/common/interfaces/tmdb.interfaces';
import { UpdateReviewDto } from './dto/review/update-review.dto';
import { Prisma } from '@prisma/client';
import { Payload } from 'src/common/interfaces/payload.interface';
import { PostReviewDto } from './dto/post-review.dto';
import { ReviewDto } from '../common/dto/review.dto';
import { HandleReviewDataDto } from './dto/review/handle-review-data.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private tmdbService: TmdbService,
    private usersService: UsersService,
  ) {}

  private async handleError<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('The requested record was not found.');
        }
      }

      console.error('Unexpected runtime error in ReviewsService:', error);
      throw new InternalServerErrorException('Internal error processing data');
    }
  }

  private normalizeMediaData(
    media: MovieDetails | TvShowDetails,
    mediaType: MediaType,
    mediaId: number,
  ): CreateMediaDto {
    if (mediaType === 'Movie') {
      const movie = media as MovieDetails;
      return {
        id: mediaId,
        type: mediaType,
        title: movie.title,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path || undefined,
      };
    } else {
      const tvShow = media as TvShowDetails;
      return {
        id: mediaId,
        type: mediaType,
        title: tvShow.name,
        releaseDate: tvShow.first_air_date,
        posterPath: tvShow.poster_path || undefined,
      };
    }
  }

  private async findReviews(
    where: object,
    paginationDto: PaginationDto,
  ): Promise<ApiResponse<ReviewDto>> {
    return this.handleError<ApiResponse<ReviewDto>>(async () => {
      const { page, limit } = paginationDto;
      const { take, skip } = getPaginationParams(page, limit);

      const [data, total] = await Promise.all([
        this.prisma.review.findMany({
          where,
          take,
          skip,
        }),
        this.prisma.review.count({ where }),
      ]);

      return {
        page: page ? page : 1,
        results: data,
        total_pages: Math.max(1, Math.ceil(total / take)),
        total_results: total,
      };
    });
  }

  private async authorizeAndExecute(
    user: Payload,
    reviewId: string,
    action: (whereClause: object) => Promise<{ count: number }>,
  ) {
    const whereClause = {
      id: reviewId,
      ...(user.role !== Role.ADMIN && { username: user.username }),
    };

    const result = await action(whereClause);

    if (result.count === 0) {
      const reviewExists = await this.prisma.review.findUnique({
        where: { id: reviewId },
      });
      if (!reviewExists) {
        throw new NotFoundException(`Review with ID ${reviewId} is not found`);
      }
      throw new ForbiddenException(
        'You do not have permission to edit or delete this review.',
      );
    }
  }

  async getReviewsByMediaId(
    mediaId: number,
    paginationDto: PaginationDto,
  ): Promise<ApiResponse<ReviewDto>> {
    return this.findReviews({ mediaId }, paginationDto);
  }

  async getReviewsByUsername(
    username: string,
    paginationDto: PaginationDto,
  ): Promise<ApiResponse<ReviewDto>> {
    return this.findReviews({ username }, paginationDto);
  }

  async createReview(
    currentUser: Payload,
    createReviewDto: HandleReviewDataDto,
  ): Promise<{ media: Media; review: Review }> {
    return this.handleError<{ media: Media; review: Review }>(async () => {
      const { username } = currentUser;

      const user = await this.usersService.getUserByUsername(username);
      const { rating, text, mediaType, mediaId } = createReviewDto;

      let mediaData: MovieDetails | TvShowDetails;

      if (mediaType === MediaType.Movie) {
        mediaData = await this.tmdbService.getMovieDetailsById(mediaId);
      } else {
        mediaData = await this.tmdbService.getTvShowDetailsById(mediaId);
      }

      const mediaDto = this.normalizeMediaData(mediaData, mediaType, mediaId);

      const reviewDto: CreateReviewDto = {
        rating,
        text,
        userId: user.id,
        username: username,
        mediaId: mediaId,
      };

      return this.handleReview(mediaDto, reviewDto);
    });
  }

  private async handleReview(
    mediaDto: CreateMediaDto,
    reviewDto: CreateReviewDto,
  ): Promise<{ media: Media; review: Review }> {
    return this.handleError<{ media: Media; review: Review }>(async () => {
      const media = await this.prisma.media.upsert({
        where: { id: mediaDto.id },
        update: {},
        create: mediaDto,
      });

      const review = await this.prisma.review.create({ data: reviewDto });

      return { media, review };
    });
  }

  async updateReview(
    user: Payload,
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<Review> {
    return this.handleError<Review>(async () => {
      await this.authorizeAndExecute(user, reviewId, (where) =>
        this.prisma.review.updateMany({ where: where, data: updateReviewDto }),
      );

      const updatedReview = await this.prisma.review.findUnique({
        where: { id: reviewId },
      });

      if (!updatedReview) {
        throw new InternalServerErrorException(
          'Failed to retrieve the review after a successful update.',
        );
      }

      return updatedReview;
    });
  }

  async deleteReview(user: Payload, reviewId: string): Promise<void> {
    return this.handleError<void>(async () => {
      await this.authorizeAndExecute(user, reviewId, (where) =>
        this.prisma.review.deleteMany({ where: where }),
      );
    });
  }
}
