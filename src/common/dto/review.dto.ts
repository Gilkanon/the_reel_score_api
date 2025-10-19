import { Expose } from 'class-transformer';

export class ReviewDto {
  @Expose()
  id: string;

  @Expose()
  rating: number;

  @Expose()
  text: string | null;

  @Expose()
  userId: string;

  @Expose()
  username: string;

  @Expose()
  mediaId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
