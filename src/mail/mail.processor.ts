import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';
import { Job } from 'bullmq';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}}`);

    switch (job.name) {
      case 'confirmation':
        const { email, name, token } = job.data;

        return this.mailService.sendConfirmationEmail(email, name, token);
      default:
        this.logger.warn(`Unknown job type ${job.name}`);
    }
  }
}
