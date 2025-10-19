import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { TmdbModule } from 'src/tmdb/tmdb.module';

@Module({
  controllers: [MediaController],
  imports: [TmdbModule],
})
export class MediaModule {}
