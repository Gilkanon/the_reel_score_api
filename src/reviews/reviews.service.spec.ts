import { MediaType, Prisma, Role, User } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { TmdbService } from 'src/tmdb/tmdb.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { count } from 'console';
import { HandleReviewDataDto } from './dto/review/handle-review-data.dto';
import { MovieDetails } from 'src/common/interfaces/tmdb.interfaces';

const mockPaginationDto: PaginationDto = {
  page: 1,
  limit: 10,
};

const mockUserPayload = {
  username: 'testuser',
  role: Role.USER,
};

const mockReview = {
  id: 'review-uuid-1',
  username: 'testuser',
  userId: 'uuid-user-1',
  mediaId: 550,
  rating: 5,
  text: 'Great movie!',
};

const mockMovie = {
  id: 550,
  title: 'Fight Club',
  release_date: '1999-10-15',
  poster_path: '/path.jpg',
};

const mockUsers: User[] = [
  {
    id: 'uuid-user-1',
    username: 'testuser',
    role: Role.USER,
    email: 'user@test.com',
    password: 'hash1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'uuid-admin-1',
    username: 'admin',
    role: Role.ADMIN,
    email: 'admin@test.com',
    password: 'hash2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPrismaService = {
  review: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  media: {
    upsert: jest.fn(),
  },
};

const mockUsersService = {
  getUserByUsername: jest.fn(),
};

const mockTmdbService = {
  getMovieDetailsById: jest.fn(),
  getTvShowDetailsById: jest.fn(),
};

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;
  let users: UsersService;
  let tmdb: TmdbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TmdbService, useValue: mockTmdbService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
    users = module.get<UsersService>(UsersService);
    tmdb = module.get<TmdbService>(TmdbService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleError (private)', () => {
    it('should return a result if there is no error', async () => {
      const fn = async () => 'success';
      await expect(service['handleError'](fn)).resolves.toBe('success');
    });

    it('should throw an HttpException unchanged', async () => {
      const error = new ForbiddenException();
      const fn = async () => {
        throw error;
      };
      await expect(service['handleError'](fn)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should convert Prisma P2025 into a NotFoundException', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('msg', {
        code: 'P2025',
        clientVersion: 'v',
      });
      const fn = async () => {
        throw error;
      };

      await expect(service['handleError'](fn)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should turn any other error into an InternalServerErrorException', async () => {
      const error = new Error('Some random error');
      const fn = async () => {
        throw error;
      };

      await expect(service['handleError'](fn)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('authorizeAndExecute (private)', () => {
    const mockAction = (where) =>
      mockPrismaService.review.updateMany({ where, data: {} });

    it('should throw a ForbiddenException, if user is not owner', async () => {
      const user = mockUsers[0];
      const reviewOwner = { ...mockReview, username: 'anotherUser' };

      mockPrismaService.review.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.review.findUnique.mockResolvedValue(reviewOwner);

      await expect(
        service['authorizeAndExecute'](user, 'review-uuid-1', mockAction),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw a NotFoundException, if review is not found', async () => {
      const user = mockUsers[0];

      mockPrismaService.review.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.review.findUnique.mockResolvedValue(null);

      await expect(
        service['authorizeAndExecute'](user, 'review-uuid-1', mockAction),
      ).rejects.toThrow(NotFoundException);
    });

    it('the admin should successfully complete the action (whereClause check)', async () => {
      const admin = mockUsers[1];

      mockPrismaService.review.updateMany.mockResolvedValue({ count: 1 });

      await service['authorizeAndExecute'](admin, 'review-uuid-1', mockAction);

      expect(prisma.review.updateMany).toHaveBeenCalledWith({
        where: { id: 'review-uuid-1' },
        data: {},
      });
    });

    it('the user should successfully complete the action (whereClause check)', async () => {
      const user = mockUsers[0];

      mockPrismaService.review.updateMany({ count: 1 });

      await service['authorizeAndExecute'](user, 'review-uuid-1', mockAction);

      expect(prisma.review.updateMany).toHaveBeenCalledWith({
        where: { id: 'review-uuid-1', username: user.username },
        data: {},
      });
    });
  });

  describe('getReviewsByMediaId', () => {
    it('should return reviews by media id', async () => {
      const mockResult = { data: [mockReview], total: 1 };
      const findReviewsSpy = jest
        .spyOn(service as any, 'findReviews')
        .mockResolvedValue(mockResult);

      const result = await service.getReviewsByMediaId(550, mockPaginationDto);

      expect(findReviewsSpy).toHaveBeenCalledWith(
        { mediaId: 550 },
        mockPaginationDto,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('createReview', () => {
    it('should call all dependencies and return media and review', async () => {
      const user = mockUsers[0];
      const dto: HandleReviewDataDto = {
        mediaType: MediaType.Movie,
        mediaId: 550,
        rating: 5,
        text: 'Great Movie!',
      };

      mockUsersService.getUserByUsername.mockResolvedValue(user);
      mockTmdbService.getMovieDetailsById.mockResolvedValue(
        mockMovie as MovieDetails,
      );

      const handleReviewSpy = jest
        .spyOn(service as any, 'handleReview')
        .mockResolvedValue({ media: mockMovie, review: mockReview });

      await service.createReview(user, dto);

      expect(mockUsersService.getUserByUsername).toHaveBeenCalledWith(
        user.username,
      );
      expect(mockTmdbService.getMovieDetailsById).toHaveBeenCalledWith(
        dto.mediaId,
      );

      expect(handleReviewSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 550,
          title: 'Fight Club',
          type: MediaType.Movie,
        }),
        expect.objectContaining({
          userId: user.id,
          username: user.username,
          rating: dto.rating,
        }),
      );
    });
  });
});
