import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { ContextInterface } from '../types/context.interface';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<ContextInterface>();

    console.log('hey from exception filter');

    if (ctx.update['message']) {
      const errorObject = {
        message: exception.message,
        command: ctx['command'],
        text: ctx.message['text'],
        chat: ctx.chat['title'],
      };

      await ctx.deleteMessage(ctx.message.message_id);
      console.log('Error: ', JSON.stringify(errorObject, null, 2));

      switch (errorObject.message) {
        case 'Вы не администратор 😡':
          await ctx
            .replyWithHTML(`<b>${errorObject.message}</b>`)
            .then(({ message_id }) => {
              setTimeout(() => ctx.deleteMessage(message_id), 3000);
            });
          break;
        default:
          await ctx
            .replyWithHTML(
              `<b>Хьюстон, у нас проблема. Проверь ошибку в логах</b>`,
            )
            .then(({ message_id }) => {
              setTimeout(() => ctx.deleteMessage(message_id), 3000);
            });
      }
    } else if (ctx.update['callback_query']) {
      const errorObject = ctx.update['message']
        ? {
            message: exception.message,
            command: ctx['command'],
            text: ctx.message['text'],
            chat: ctx.chat['title'],
          }
        : {
            message: exception.message,
            command: ctx.callbackQuery['data'],
            chat: ctx.chat['title'],
          };

      await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      console.log('Error: ', JSON.stringify(errorObject, null, 2));

      await ctx
        .replyWithHTML(`<b>Хьюстон, у нас проблема. Проверь ошибку в логах</b>`)
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
    }
  }
}
