import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import * as path from 'node:path';
import * as process from 'node:process';
import * as fs from 'node:fs';
import * as hbs from 'handlebars';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow('RESEND_API_KEY'));
  }

  async sendConfirmationEmail(email: string, name: string, token: string) {
    const verificationUrl = `${this.config.getOrThrow('APP_URL')}/auth/verify?token=${token}}`;

    const templatePath = path.join(
      process.cwd(),
      'dist/src/mail/templates/confirmation.hbs',
    );

    let html: string;
    try {
      const source = fs.readFileSync(templatePath, 'utf8');

      const template = hbs.compile(source);
      html = template({ name, url: verificationUrl });
    } catch (err) {
      console.error('Error reading email template:', err);
      html = `<p>Welcome ${name}! Please verify your email: <a href="${verificationUrl}">Link</a></p>`;
    }

    try {
      const data = await this.resend.emails.send({
        from: 'The Reel Score <onboarding@resend.dev>',
        to: [email],
        subject: 'Verify your email address',
        html: html,
      });

      return data;
    } catch (err) {
      console.error('Error sending email:', err);
      throw new InternalServerErrorException('Failed to send email');
    }
  }
}
