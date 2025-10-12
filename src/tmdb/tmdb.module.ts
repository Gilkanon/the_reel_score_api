import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [TmdbController],
  providers: [TmdbService],
  imports: [HttpModule],
})
export class TmdbModule {}
