import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  TelegrafExecutionContext,
  TelegrafException,
  InjectBot,
} from 'nestjs-telegraf';
import { ContextInterface } from '../types/context.interface';

import { Telegraf } from 'telegraf';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectBot('HelperBot') private readonly bot: Telegraf<ContextInterface>,
  ) {}
  async canActivate(context: ExecutionContext) {
    const ctx = TelegrafExecutionContext.create(context);
    const { from, chat, update } = ctx.getContext<ContextInterface>();

    const chatMember = await this.bot.telegram.getChatMember(chat.id, from.id);

    const isAdmin =
      chatMember.status === 'administrator' ||
      chatMember.status === 'creator' ||
      update['message'].author_signature === 'админ';
    if (!isAdmin) {
      throw new TelegrafException('Вы не администратор 😡');
    }

    return true;
  }
}
