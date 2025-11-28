import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { plainToInstance } from 'class-transformer';
import { TokenDto } from './dto/token.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private config: ConfigService,
  ) {}

  private extractRefreshTokenFromCookie(req: Request) {
    if (req && req.cookies) {
      return req.cookies.refreshToken;
    } else {
      throw new UnauthorizedException('Refresh token is required');
    }
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    return res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: this.config.getOrThrow('NODE_ENV') === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(registerDto);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return plainToInstance(TokenDto, tokens);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return plainToInstance(TokenDto, tokens);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.extractRefreshTokenFromCookie(req);
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken');
  }

  @Post('refresh')
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.extractRefreshTokenFromCookie(req);

    const tokens = await this.authService.refreshToken(refreshToken);

    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return plainToInstance(TokenDto, tokens);
  }
}
