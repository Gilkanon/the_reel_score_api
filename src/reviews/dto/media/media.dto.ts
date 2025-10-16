import { MediaType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class MediaDto {
  @Expose()
  id: number;

  @Expose()
  type: MediaType;

  @Expose()
  title: string;

  @Expose()
  releaseDate: string;

  @Expose()
  posterPath: string;
}
