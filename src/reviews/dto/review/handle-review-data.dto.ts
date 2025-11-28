import { MediaType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HandleReviewDataDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  text?: string;

  @IsNotEmpty()
  @IsEnum(MediaType, {
    message: 'mediaType must be either Movie or TV',
  })
  mediaType: MediaType;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  mediaId: number;
}
