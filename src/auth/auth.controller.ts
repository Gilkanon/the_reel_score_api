import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { plainToInstance } from 'class-transformer';
import { TokenDto } from './dto/token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const tokens = await this.authService.register(registerDto);

    return plainToInstance(TokenDto, tokens);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const tokens = await this.authService.login(loginDto);

    return plainToInstance(TokenDto, tokens);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() data) {
    const { refreshToken } = data;
    return this.authService.logout(refreshToken);
  }

  @Post('refresh')
  async refreshTokens(@Body() data) {
    const { refreshToken } = data;
    const tokens = await this.authService.refreshToken(refreshToken);

    return plainToInstance(TokenDto, tokens);
  }
}
