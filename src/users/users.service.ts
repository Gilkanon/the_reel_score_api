import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import CreateUserDto from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import UpdateUserDto from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  getSalt(): string | number {
    const salt = this.configService.get<string | number>('SALT');
    return salt ? salt : 10;
  }

  async getUserByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      throw new NotFoundException('User with such username is not found');
    }

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const { password } = createUserDto;
    const passwordHashed: string = await bcrypt.hash(password, this.getSalt());
    createUserDto.password = passwordHashed;
    const user = await this.prisma.user.create({
      data: createUserDto,
    });

    return user;
  }

  async updateUser(username: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const passwordHashed: string = await bcrypt.hash(
        updateUserDto.password,
        this.getSalt(),
      );
      updateUserDto = { ...updateUserDto, password: passwordHashed };
    }

    const user = await this.prisma.user.update({
      where: { username: username },
      data: updateUserDto,
    });
  }

  async deleteUser(username: string) {
    const user = await this.prisma.user.delete({
      where: { username: username },
    });

    return { message: `User with username ${user.username} has been deleted` };
  }
}
