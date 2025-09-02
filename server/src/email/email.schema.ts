import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true })
  messageId: string;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  receivedAt: Date;

  @Prop({ type: Object })
  rawHeaders: Record<string, any>;

  @Prop([String])
  receivingChain: string[];

  @Prop()
  espType: string;

  @Prop()
  espDetails: string;

  @Prop({ default: false })
  processed: boolean;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
