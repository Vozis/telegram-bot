import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import * as LocalSession from 'telegraf-session-local';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { GroupModule } from './group/group.module';
import { UserModule } from './user/user.module';
import { BotModule } from './bot/bot.module';
import { LessonModule } from './lesson/lesson.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronJobModule } from './cron-job/cron-job.module';
import { TaskModule } from './task/task.module';
import { SheetModule } from './sheet/sheet.module';

const sessions = new LocalSession({
  database: 'session.db.json',
});

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      botName: 'HelperBot',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        middlewares: [sessions.middleware()],
        include: [BotModule],
        options: {
          handlerTimeout: Infinity,
        },
      }),
      inject: [ConfigService],
    }),
    GroupModule,
    UserModule,
    BotModule,
    LessonModule,
    CronJobModule,
    TaskModule,
    SheetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
