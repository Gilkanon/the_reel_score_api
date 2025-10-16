import { ValidateNested } from 'class-validator';
import { CreateMediaDto } from './media/create-media.dto';
import { Type } from 'class-transformer';
import { CreateReviewDto } from './review/create-review.dto';

export class PostReviewDto {
  @ValidateNested()
  @Type(() => CreateMediaDto)
  media: CreateMediaDto;

  @ValidateNested()
  @Type(() => CreateReviewDto)
  review: CreateReviewDto;
}
