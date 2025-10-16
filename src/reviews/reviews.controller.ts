import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateReviewDto } from './dto/review/update-review.dto';
import { plainToInstance } from 'class-transformer';
import { ReviewDto } from './dto/review/review.dto';
import { MediaDto } from './dto/media/media.dto';
import { PostReviewDto } from './dto/post-review.dto';
import { CreateReviewDto } from './dto/review/create-review.dto';
import { HandleReviewDataDto } from './dto/review/handle-review-data.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  async createReview(
    @Req() req,
    @Body() createReviewDto: HandleReviewDataDto,
  ): Promise<{ media: MediaDto; review: ReviewDto }> {
    const { media, review } = await this.reviewsService.createReview(
      req.user,
      createReviewDto,
    );

    return {
      media: plainToInstance(MediaDto, media),
      review: plainToInstance(ReviewDto, review),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateReview(
    @Req() req,
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    const updatedReview = await this.reviewsService.updateReview(
      req.user,
      id,
      updateReviewDto,
    );

    return plainToInstance(ReviewDto, updatedReview);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  async deleteReview(@Req() req, @Param('id') id: string): Promise<void> {
    await this.reviewsService.deleteReview(req, id);
  }
}
