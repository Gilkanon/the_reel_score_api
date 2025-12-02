import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteInactiveUsers() {
    const { count } = await this.prisma.user.deleteMany({
      where: {
        verified: false,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    this.logger.log(`${count} inactive users has been deleted from database`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredTokens() {
    const { count } = await this.prisma.token.deleteMany({
      where: {
        expiresIn: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`${count} expired tokens deleted from database`);
  }
}
