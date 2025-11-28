import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { plainToInstance } from 'class-transformer';
import UserDto from './dto/user.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import UpdateUserDto from './dto/update-user.dto';
import { ReviewsService } from 'src/reviews/reviews.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ReviewDto } from 'src/common/dto/review.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get('/:username')
  async getUserByUsername(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ user: UserDto; reviews: ApiResponse<ReviewDto> }> {
    const [user, reviews] = await Promise.all([
      this.usersService.getUserByUsername(username),
      this.reviewsService.getReviewsByUsername(username, paginationDto),
    ]);

    return {
      user: plainToInstance(UserDto, user),
      reviews: {
        ...reviews,
        results: reviews.results.map((review) =>
          plainToInstance(ReviewDto, review),
        ),
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/me')
  async updateOwnUserData(@Body() updateUserDto: UpdateUserDto, @Req() req) {
    const { username } = req.user;

    const user = await this.usersService.updateUser(username, updateUserDto);

    return plainToInstance(UserDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/me')
  async deleteOwnUserProfile(@Req() req) {
    const { username } = req.user;

    return this.usersService.deleteUser(username);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('/:username')
  async updateUserData(
    @Param('username') username: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(username, updateUserDto);

    return plainToInstance(UserDto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('/:username')
  async deleteUserProfile(@Param('username') username: string) {
    return this.usersService.deleteUser(username);
  }
}
