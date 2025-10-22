import { Role, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUsersService = {
  createUser: jest.fn(),
  getUserByUsername: jest.fn(),
};

const mockPrismaService = {
  user: {
    findFirst: jest.fn(),
  },
  token: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockUser: User = {
  id: 'user-uuid-123',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTokenDto = {
  accessToken: 'fakeAccessToken',
  refreshToken: 'fakeRefreshToken',
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@expample.com',
      password: 'password123',
    };

    let loginSpy: jest.SpyInstance;

    beforeEach(() => {
      loginSpy = jest.spyOn(service, 'login').mockResolvedValue(mockTokenDto);
    });

    it('should successfully register the user and call login', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: registerDto.email },
            { username: registerDto.username },
          ],
        },
      });
      expect(usersService.createUser).toHaveBeenCalledWith(registerDto);
      expect(loginSpy).toHaveBeenCalledWith({
        username: registerDto.username,
        password: registerDto.password,
      });
      expect(result).toEqual(mockTokenDto);
    });

    it('should throw ConflictException if the email already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(loginSpy).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if the username already exists', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        username: registerDto.username,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.createUser).not.toHaveBeenCalled();
      expect(loginSpy).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'password123' };

    it('should successfully log in the user and return tokens', async () => {
      mockUsersService.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValue('fakeAccessToken');
      mockPrismaService.token.create.mockResolvedValue({ id: 'token-uuid' });

      const result = await service.login(loginDto);

      expect(usersService.getUserByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { username: mockUser.username, role: mockUser.role },
        { expiresIn: '30m' },
      );
      expect(prisma.token.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('fakeAccessToken');
      expect(result.refreshToken).toEqual(expect.any(String));
    });

    it('should throw UnauthorizedException if the password is invalid', async () => {
      mockUsersService.getUserByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw an error if the user is not found (via UsersService)', async () => {
      mockUsersService.getUserByUsername.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('refreshToken', () => {
    const mockDbToken = {
      id: 'token-uuid',
      token: 'fakeRefreshToken',
      userId: mockUser.id,
      expiresIn: new Date(Date.now() + 1000 * 60 * 60),
    };

    it('should successfully refresh the token', async () => {
      mockPrismaService.token.findFirst.mockResolvedValue(mockDbToken);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('newAccessToken');
      mockPrismaService.token.update.mockResolvedValue({
        ...mockDbToken,
        token: 'newRefreshToken',
      });

      const result = await service.refreshToken('fakeRefreshToken');

      expect(prisma.token.findFirst).toHaveBeenCalledWith({
        where: { token: 'fakeRefreshToken' },
      });
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: mockDbToken.userId },
      });
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(prisma.token.update).toHaveBeenCalled();
      expect(result.accessToken).toBe('newAccessToken');
      expect(result.refreshToken).not.toBe('fakeRefreshToken');
    });

    it('should throw UnauthorizedException if the token is not found', async () => {
      mockPrismaService.token.findFirst.mockResolvedValue(null);

      await expect(service.refreshToken('fakeRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if the toke is expired', async () => {
      const expiredToken = {
        ...mockDbToken,
        expiresIn: new Date(Date.now() - 10000),
      };
      mockPrismaService.token.findFirst.mockResolvedValue(expiredToken);

      await expect(service.refreshToken('fakeRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully delete the token', async () => {
      mockPrismaService.token.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('fakeRefreshToken');

      expect(prisma.token.deleteMany).toHaveBeenCalledWith({
        where: { token: 'fakeRefreshToken' },
      });
    });

    it('should throw UnauthorizedException if token is not found', async () => {
      mockPrismaService.token.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.logout('fakeRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
