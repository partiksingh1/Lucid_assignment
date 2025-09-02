import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Imap from 'imap';
import { simpleParser, Source } from 'mailparser';
import { Cron } from '@nestjs/schedule';
import { Email, EmailDocument } from './email.schema';
import dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private imap: Imap;

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
  ) {
    this.initializeImap();
  }

  private initializeImap(): void {
    this.imap = new Imap({
      user: process.env.IMAP_USER!,
      password: process.env.IMAP_PASSWORD!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.imap.once('ready', () => {
      this.logger.log('IMAP connection ready');
    });

    this.imap.once('error', (err: any) => {
      this.logger.error('IMAP connection error:', err);
    });

    this.imap.once('end', () => {
      this.logger.log('IMAP connection ended');
    });
  }

  // Ensure connection before checking for new emails
  private ensureImapConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.imap.state === 'ready') {
        return resolve();
      }
      this.imap.once('ready', resolve);
      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  // Check for new emails every 30 seconds
  @Cron('*/30 * * * * *')
  async checkForNewEmails(): Promise<void> {
    try {
      await this.ensureImapConnection();
      await this.connectAndFetchEmails();
    } catch (error) {
      this.logger.error('Error checking emails:', error);
    }
  }

  private async connectAndFetchEmails(): Promise<void> {
    try {
      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          this.logger.error('Error opening inbox:', err);
          return;
        }

        // Search for unread emails with a specific subject
        this.imap.search(
          ['UNSEEN', ['SUBJECT', 'Buy MORE, Save MORE 🔥']],
          async (err, results) => {
            if (err) {
              this.logger.error('Error searching emails:', err);
              return;
            }

            if (results.length === 0) {
              this.logger.log('No new test emails found.');
              return;
            }

            this.logger.log(`Found ${results.length} new test emails`);

            const fetch = this.imap.fetch(results, {
              bodies: '',
              markSeen: true,
            });

            fetch.on('message', (msg, seqno) => {
              this.processMessage(msg, seqno);
            });

            fetch.once('error', (err) => {
              this.logger.error('Error fetching messages:', err);
            });

            fetch.once('end', () => {
              this.logger.log('Finished fetching emails.');
            });
          },
        );
      });
    } catch (error) {
      this.logger.error('Error fetching emails:', error);
    }
  }

  private async processMessage(msg: any, seqno: number): Promise<void> {
    msg.on('body', async (stream: Source, info: any) => {
      try {
        const parsed = await simpleParser(stream);
        this.logger.log('Processed msg ', parsed);
        console.log('type is', typeof parsed); // This will log the type of parsed (e.g., "object", "string", "number", etc.)

        await this.analyzeAndStoreEmail(parsed);
      } catch (error) {
        this.logger.error(`Error processing message ${seqno}:`, error);
      }
    });
  }

  private async analyzeAndStoreEmail(parsedEmail: any): Promise<void> {
    try {
      const messageId = parsedEmail.messageId;
      // Check if we already processed this email
      const existingEmail = await this.emailModel.findOne({ messageId });
      if (existingEmail) {
        return;
      }
      console.log('parsedEmail.headers.received:', parsedEmail.headers);
      console.log(
        'type parsedEmail.headers.received:',
        typeof parsedEmail.headers,
      );
      const receivingChain = this.extractReceivingChain(parsedEmail.headers);

      console.log('receivingChain is ', receivingChain);

      const espAnalysis = this.detectESP(parsedEmail.from);

      const emailDoc = new this.emailModel({
        messageId,
        sender: parsedEmail.from?.text || 'Unknown',
        subject: parsedEmail.subject || '',
        receivedAt: new Date(),
        rawHeaders: parsedEmail.headers,
        receivingChain,
        espType: espAnalysis.type,
        espDetails: espAnalysis.details,
        processed: true,
      });

      await emailDoc.save();
      this.logger.log(
        `Successfully processed email from ${parsedEmail.from?.text}`,
      );
    } catch (error) {
      this.logger.error('Error analyzing email:', error);
    }
  }

  private extractReceivingChain(headers: any): string[] {
    const receivedHeaders = headers.get('received');
    if (!receivedHeaders || !Array.isArray(receivedHeaders)) {
      console.log('No received headers available');
      return [];
    }
    const chain: string[] = [];
    console.log('receivedHeaders', receivedHeaders);

    // Process Received headers in reverse order (oldest first)
    receivedHeaders.reverse().forEach((received: string) => {
      // Prefer 'from' server over 'by' server to get the sender server first
      const fromMatch = received.match(/from\s+([^\s;]+)/i);
      const byMatch = received.match(/by\s+([^\s;]+)/i);

      let server = null;
      if (fromMatch && fromMatch[1]) {
        server = fromMatch[1];
      } else if (byMatch && byMatch[1]) {
        server = byMatch[1];
      }

      if (server) {
        server = server.replace(/[\[\]]/g, ''); // Remove brackets
        if (!chain.includes(server)) {
          chain.push(server);
        }
      }
    });
    console.log('chain is', chain);
    return chain;
  }

  private detectESP(from: any): { type: string; details: string } {
    // Extract the email address from the provided "from" object
    const email = from.value[0]?.address || '';

    // Regular expression to match the domain part after '@' in the email address
    const domainMatch = email.match(/@([a-zA-Z0-9.-]+)/);

    // Check if a valid domain was found
    if (domainMatch && domainMatch[1]) {
      return {
        type: domainMatch[1], // Domain as the type (e.g., gmail, yahoo)
        details: email, // Return the full email address as the details
      };
    }

    // Return 'unknown' if no domain match was found
    return {
      type: 'unknown',
      details: email,
    };
  }

  // Helper methods for detecting ESPs
  private isGmail(receivedHeaders: string, messageId: string): boolean {
    return /gmail\.com/.test(receivedHeaders) || /gmail\.com/.test(messageId);
  }

  private isOutlook(receivedHeaders: string, messageId: string): boolean {
    return (
      messageId.includes('outlook.com') ||
      receivedHeaders.includes('outlook.com')
    );
  }

  private isYahoo(receivedHeaders: string, messageId: string): boolean {
    return (
      messageId.includes('yahoo.com') || receivedHeaders.includes('yahoo.com')
    );
  }

  private isAmazonSes(receivedHeaders: string, messageId: string): boolean {
    return (
      receivedHeaders.includes('amazonses.com') ||
      messageId.includes('amazonses.com')
    );
  }

  private isSendGrid(receivedHeaders: string, messageId: string): boolean {
    return (
      receivedHeaders.includes('sendgrid.net') ||
      messageId.includes('sendgrid.net')
    );
  }

  private isMailgun(receivedHeaders: string, messageId: string): boolean {
    return (
      receivedHeaders.includes('mailgun.org') ||
      messageId.includes('mailgun.org')
    );
  }

  private isZoho(receivedHeaders: string, messageId: string): boolean {
    return (
      messageId.includes('zoho.com') || receivedHeaders.includes('zoho.com')
    );
  }

  private isICloud(receivedHeaders: string, messageId: string): boolean {
    return (
      messageId.includes('icloud.com') || receivedHeaders.includes('icloud.com')
    );
  }

  // API endpoints for emails
  async getAllEmails(): Promise<Email[]> {
    return this.emailModel.find().sort({ receivedAt: -1 }).exec();
  }

  async getLatestEmail(): Promise<Email | null> {
    return this.emailModel.findOne().sort({ receivedAt: -1 }).exec();
  }

  async getEmailById(id: string): Promise<Email | null> {
    return this.emailModel.findById(id).exec();
  }
}