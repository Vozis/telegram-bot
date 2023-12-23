import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { ContextInterface } from './bot/types/context.interface';

@Injectable()
export class AppService {
  constructor(
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
  ) {}

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_NOON)
  async sendReminderPay() {
    const groupId = '-1002034905765';
    this.bot.telegram.sendMessage(
      groupId,
      'Пора платить, ребятки!!! А то сами будете писать ваши увеломления',
    );
    return;
  }
  getHello(): string {
    return 'Hello World!';
  }
}
