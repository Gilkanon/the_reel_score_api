import { MediaType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class HandleReviewDataDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  text?: string;

  @IsNotEmpty()
  @IsEnum(() => MediaType)
  mediaType: MediaType;

  @IsNotEmpty()
  @IsNumber()
  mediaId: number;
}
