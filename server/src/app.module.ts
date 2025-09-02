import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from './email/email.module';
import { ScheduleModule } from '@nestjs/schedule';
import dotenv from 'dotenv';
dotenv.config();
@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI!
    ),
    ScheduleModule.forRoot(),
    EmailModule,
  ],
})
export class AppModule { }
