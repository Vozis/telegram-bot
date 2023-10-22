import { Module } from '@nestjs/common';
import { BotService } from './bot/bot.service';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import * as LocalSession from 'telegraf-session-local';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as process from 'process';
import { AppController } from './app.controller';
import { GroupModule } from './groups/group.module';
import { UserModule } from './users/user.module';

const sessions = new LocalSession({
  database: 'session.db.json',
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('BOT_TOKEN'),
        middlewares: [sessions.middleware()],
      }),
      inject: [ConfigService],
    }),
    // TelegrafModule.forRoot({
    //   middlewares: [sessions.middleware()],
    //   token: process.env.BOT_TOKEN,
    // }),
    GroupModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, BotService],
})
export class AppModule {}
