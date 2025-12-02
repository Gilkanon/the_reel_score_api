import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { TokenDto } from './dto/token.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    @InjectQueue('mail-queue') private mailQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;

    try {
      const user = await this.usersService.createUser({
        username,
        email,
        password,
      });

      const token = uuidv4();

      await this.cacheManager.set(`verify:${token}`, user.id, 86400 * 1000);

      await this.mailQueue.add('confirmation', {
        email: user.email,
        name: user.username,
        token: token,
      });

      return this.login({ username: user.username, password: password });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];

          if (target.includes('email')) {
            throw new ConflictException('Email already exists');
          }
          if (target.includes('username')) {
            throw new ConflictException('Username already exists');
          }
          throw new ConflictException('Account already exists');
        }
      }
    }

    throw new InternalServerErrorException('Failed to register user');
  }

  async login(loginDto: LoginDto): Promise<TokenDto> {
    const { username, password } = loginDto;

    const user = await this.usersService.getUserByUsername(username);

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong username or password');
    }

    const payload = { username: user.username, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    });
    const refreshToken = randomBytes(64).toString('hex');

    await this.prisma.token.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenDto> {
    const token = await this.prisma.token.findFirst({
      where: { token: refreshToken },
    });

    if (!token || token.expiresIn < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: token.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload = { username: user.username, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30m',
    });

    const newRefreshToken = randomBytes(64).toString('hex');

    await this.prisma.token.update({
      where: { id: token.id },
      data: {
        token: newRefreshToken,
        expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const { count } = await this.prisma.token.deleteMany({
      where: { token: refreshToken },
    });

    if (count === 0) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async emailVerification(token: string) {
    const userId = await this.cacheManager.get(`verify:${token}`);

    if (!userId) {
      throw new NotFoundException('Invalid token');
    }

    const user = await this.usersService.updateUserValidation(String(userId));

    if (!user) {
      throw new NotFoundException('Invalid token');
    }

    await this.cacheManager.del(`verify:${token}`);

    return {
      message: 'Email verified successfully',
    };
  }
}
