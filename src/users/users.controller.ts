import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { plainToInstance } from 'class-transformer';
import UserDto from './dto/user.dto';

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
}
