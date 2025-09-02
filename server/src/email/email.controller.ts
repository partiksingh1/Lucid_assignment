import { Controller, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';
import { Email } from './email.schema';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async getAllEmails(): Promise<Email[]> {
    return this.emailService.getAllEmails();
  }

  @Get('latest')
  async getLatestEmail(): Promise<Email | null> {
    return this.emailService.getLatestEmail();
  }

  @Get(':id')
  async getEmailById(@Param('id') id: string): Promise<Email | null> {
    return this.emailService.getEmailById(id);
  }

  @Get('config/email-address')
  getEmailAddress(): { emailAddress: string; subject: string } {
    return {
      emailAddress: process.env.IMAP_USER || 'your-email@gmail.com',
      subject: 'EMAIL_ANALYSIS_TEST',
    };
  }
}
