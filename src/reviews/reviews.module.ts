import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TmdbModule } from 'src/tmdb/tmdb.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  imports: [PrismaModule, TmdbModule, UsersModule],
})
export class ReviewsModule {}
