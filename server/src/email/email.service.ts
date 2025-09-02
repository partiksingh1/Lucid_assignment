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
  private imap: Imap | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 30000; // 30 seconds

  constructor(
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>,
  ) { }
  // Clean up connections when module is destroyed
  onModuleDestroy() {
    this.cleanup();
  }
  private cleanup(): void {
    if (this.imap) {
      this.imap.removeAllListeners();
      if (this.imap.state !== 'disconnected') {
        this.imap.end();
      }
      this.imap = null;
    }
    this.connectionPromise = null;
    this.isConnecting = false;
  }

  private createImap(): Imap {
    const imap = new Imap({
      user: process.env.IMAP_USER!,
      password: process.env.IMAP_PASSWORD!,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
        servername: 'imap.gmail.com'
      },
      keepalive: {
        interval: 10000,
        idleInterval: 300000,
        forceNoop: true
      }
    });

    // Set max listeners to prevent memory leak warning
    imap.setMaxListeners(15);

    return imap;
  }

  private setupImapEventListeners(imap: Imap): void {
    imap.once('ready', () => {
      this.logger.log('IMAP connection ready');
      this.reconnectAttempts = 0; // Reset on successful connection
    });

    imap.once('error', (err: any) => {
      this.logger.error('IMAP connection error:', err.message);
      this.handleConnectionError(err);
    });

    imap.once('end', () => {
      this.logger.log('IMAP connection ended');
      this.cleanup();
    });

    imap.on('close', (hadError: boolean) => {
      this.logger.log(`IMAP connection closed${hadError ? ' with error' : ''}`);
      this.cleanup();
    });
  }
  private handleConnectionError(error: any): void {
    this.cleanup();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.logger.log(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay / 1000}s`);

      setTimeout(() => {
        this.connectionPromise = null;
      }, this.reconnectDelay);
    } else {
      this.logger.error('Max reconnection attempts reached. Will retry on next cron job.');
      this.reconnectAttempts = 0; // Reset for next cron cycle
    }
  }

  // Ensure connection before checking for new emails
  private ensureImapConnection(): Promise<void> {
    // If already connecting, wait for that connection
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected and ready, return immediately
    if (this.imap && this.imap.state === 'authenticated') {
      return Promise.resolve();
    }
    // Create new connection
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.cleanup(); // Clean up any existing connection

        this.imap = this.createImap();
        this.setupImapEventListeners(this.imap);

        const timeout = setTimeout(() => {
          reject(new Error('IMAP connection timeout'));
        }, 30000); // 30 second timeout

        this.imap.once('ready', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.imap.once('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });

        this.imap.connect();
      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  // Check for new emails every 2 minutes
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
    return new Promise((resolve, reject) => {
      if (!this.imap || this.imap.state !== 'authenticated') {
        reject(new Error('IMAP not connected'));
        return;
      }

      this.imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          this.logger.error('Error opening inbox:', err);
          reject(err);
          return;
        }

        // Search for unread emails with a specific subject
        this.imap?.search(
          ['UNSEEN', ['SUBJECT', 'EMAIL_ANALYSIS_TEST']],
          (err, results) => {
            if (err) {
              this.logger.error('Error searching emails:', err);
              reject(err);
              return;
            }

            if (results.length === 0) {
              this.logger.log('No new test emails found.');
              resolve();
              return;
            }

            this.logger.log(`Found ${results.length} new test emails`);

            const fetch = this.imap?.fetch(results, {
              bodies: '',
              markSeen: true,
            });

            let processedCount = 0;
            const totalCount = results.length;

            fetch?.on('message', (msg, seqno) => {
              this.processMessage(msg, seqno).finally(() => {
                processedCount++;
                if (processedCount === totalCount) {
                  resolve();
                }
              });
            });

            fetch?.once('error', (err) => {
              this.logger.error('Error fetching messages:', err);
              reject(err);
            });

            fetch?.once('end', () => {
              this.logger.log('Finished fetching emails.');
              if (processedCount === totalCount) {
                resolve();
              }
            });
          },
        );
      });
    });
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