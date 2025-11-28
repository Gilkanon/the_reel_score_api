import { Exclude, Expose } from 'class-transformer';

export class TokenDto {
  @Expose()
  accessToken: string;

  @Exclude()
  refreshToken: string;
}
