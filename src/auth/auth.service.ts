import {
  ConflictException,
  Injectable,
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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('User with this email already exist');
      }
      if (existingUser.username === username) {
        throw new ConflictException('User with this username already exist');
      }
    }

    const user = await this.usersService.createUser({
      username,
      email,
      password,
    });

    return this.login({ username: user.username, password: password });
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

    if (!token || token.expiresIn > new Date()) {
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
    const deleted = await this.prisma.token.delete({
      where: { token: refreshToken },
    });

    if (!deleted) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
