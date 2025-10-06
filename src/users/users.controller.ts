import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/:username')
  async getUserByUsername(
    @Param('username') username: string,
  ): Promise<UserDto> {
    const user = await this.usersService.getUserByUsername(username);

    return plainToInstance(UserDto, user);
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
    @Param() username: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(username, updateUserDto);

    return plainToInstance(UserDto, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('/:username')
  async deleteUserProfile(@Param() username: string) {
    return this.usersService.deleteUser(username);
  }
}
