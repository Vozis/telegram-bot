import { AppService } from '../app.service';
import {
  Action,
  Command,
  Ctx,
  Hears,
  Help,
  InjectBot,
  Message,
  On,
  Sender,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { actionButtons } from './bot.buttons';
import {
  ContextInterface,
  SceneContextInterface,
} from './types/context.interface';
import { UserService } from '../user/user.service';
import { adminOptions, userOptions } from './options';
import { GroupService } from '../group/group.service';
import { OnModuleDestroy, UseFilters, UseGuards } from '@nestjs/common';

import { TelegrafExceptionFilter } from './filters/telegraf-exception.filter';
import { AdminGuard } from './guards/admin.guard';

import { LessonService } from '../lesson/lesson.service';
import { CronJobService } from '../cron-job/cron-job.service';
import { toHoursAndMinutes } from '../utils/functions';
import { message } from 'telegraf/filters';

@Update()
export class BotUpdate implements OnModuleDestroy {
  constructor(
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly lessonService: LessonService,
    private readonly cronJobService: CronJobService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: ContextInterface, @Sender() sender: any) {
    try {
      await this.bot.telegram.setMyCommands([
        { command: '/start', description: 'Начало работы' },
        { command: '/admin', description: 'Функции администратора' },
        {
          command: '/get_schedule',
          description: 'Получить расписание',
        },
      ]);
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx
        .reply(
          `Приветствую в нашей группе!. Здесь есть бот, который поможет тебе узнать текущее расписание занятий. (p.s. у меня еще есть косяки, нахожусь в процессе устранения:)`,
          {
            disable_notification: true,
          },
        )
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
      return;
      // await ctx.reply('Приветствую в нашей группе!)');
    } catch (err) {
      console.log(err.message);
      await ctx
        .reply(`Хьюстон, у нас проблема. Проверь ошибку в логах`)
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
      return;
    }
  }
  @UseFilters(TelegrafExceptionFilter)
  @Help()
  async help(@Ctx() ctx: ContextInterface) {
    await ctx.deleteMessage(ctx.message.message_id);
    await ctx
      .reply('Данный раздел еще на доработке :(')
      .then(({ message_id }) => {
        setTimeout(() => ctx.deleteMessage(message_id), 3000);
      });
    return;
  }

  // Lessons logic =================================================================

  @Action('createGroupSchedule')
  async createLessonScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter('createLessonScene');
  }

  @Action('updateSchedule')
  async updateLessonScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter('updateLessonScene');
  }

  @UseGuards(AdminGuard)
  @Action('getScheduleAdmin')
  async getScheduleAdmin(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter('getLessonsScene');
  }

  // Actions =================================================================

  @UseGuards(AdminGuard)
  @UseFilters(TelegrafExceptionFilter)
  @Command('admin')
  async showAdmin(@Ctx() ctx: ContextInterface) {
    try {
      // console.log(await ctx.getChatMember(ctx.message.from.id));
      // console.log('ctx: ', ctx.message.from);
      // const isAdmin = await this.isAdmin(ctx.chat.id, ctx.from.id, ctx);

      // console.log('isAdmin: ', isAdmin);

      await ctx.deleteMessage(ctx.message.message_id);
      await ctx
        .reply('Что ты хочешь сделать?', {
          disable_notification: true,
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Добавить группу в БД', callback_data: 'createGroup' }],
              [
                {
                  text: 'Добавить расписание группы',
                  callback_data: 'createGroupSchedule',
                },
              ],
              [
                {
                  text: 'Получить расписание для всех групп',
                  callback_data: 'getScheduleAdmin',
                },
              ],
              [
                {
                  text: 'Изменить расписание для группы',
                  callback_data: 'updateSchedule',
                },
              ],
            ],
          },
        })
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 10000);
        });
      return;
    } catch (err) {
      console.log(err.message);
      // await ctx.deleteMessage(ctx.message.message_id);
      // await ctx.replyWithHTML(err.message).then(({ message_id }) => {
      //   setTimeout(() => ctx.deleteMessage(message_id), 3000);
      // });
      // return;
    }
  }

  // @UseFilters(TelegrafExceptionFilter)
  @UseGuards(AdminGuard)
  @Action('getCronJobs')
  async getCronJobs(@Ctx() ctx: ContextInterface) {
    const jobs = await this.cronJobService.getCronJobsForGroup();

    return jobs;
  }

  @Action('createGroup')
  async createGroup(@Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.bot.telegram.getChat(ctx.chat.id);
      const newGroup = await this.groupService.create({
        name: groupInfo['title'],
        telegramId: groupInfo.id,
      });
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx
        .reply(`Создана группа ${newGroup.name}`)
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
      return;
    } catch (err) {
      console.log(err.message);
      // await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
      await ctx.replyWithHTML(err.message).then(({ message_id }) => {
        setTimeout(() => ctx.deleteMessage(message_id), 3000);
      });
      return;
    }
  }
  @UseFilters(TelegrafExceptionFilter)
  @Command('get_schedule')
  async getSchedule(@Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.groupService.getByTelegramId(ctx.chat.id);

      const lessons = await this.lessonService.getByGroupId(groupInfo.id);
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx
        .replyWithHTML(
          `
      <b>Твое расписание: </b>
      ${
        lessons.length > 0
          ? lessons.map(lesson => {
              const lessonTime = toHoursAndMinutes(lesson.time);
              return `<i> - ${lesson.day} ${lessonTime.hours}:${
                lessonTime.minutes === 0 ? '00' : lessonTime.minutes
              }</i> \n`;
            })
          : 'Пока занятий нет'
      }`,
          { disable_notification: true },
        )
        .then(({ message_id }) => {
          setTimeout(() => ctx.deleteMessage(message_id), 3000);
        });
      return;
    } catch (err) {
      console.log(err.message);
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx.replyWithHTML(err.message).then(({ message_id }) => {
        setTimeout(() => ctx.deleteMessage(message_id), 3000);
      });
      return;
    }
  }

  // =================================================================
  // НЕ ИСПОЛЬЗЛУЕТСЯ
  // =================================================================

  // @UseFilters(TelegrafExceptionFilter)
  // @Action('addAdminGroup')
  // async toggleAdminGroup(@Ctx() ctx: ContextInterface) {
  //   const group = await this.groupService.getByTelegramId(ctx.chat.id);
  //
  //   const result = await this.userService.toggleGroup(
  //     ctx.callbackQuery.from.id,
  //     group.id,
  //   );
  //
  //   if (result) {
  //     await ctx.reply(`Группа ${group.name} добавлена к данным админа`);
  //     return;
  //   }
  //
  //   await ctx.reply(`Группа ${group.name} удалена из данных админа`);
  //   return;
  // }

  // @On('chat_join_request')
  // async addUser(
  //   @Ctx()
  //   ctx: ContextInterface & {
  //     message: {
  //       new_chat_participant: {
  //         first_name: string;
  //         last_name: string;
  //         username: string;
  //         id: number;
  //       };
  //     };
  //   },
  // ) {
  //   try {
  //     console.log(ctx);
  //     // const newUser = {
  //     //   firstName: ctx.message.new_chat_participant.first_name || 'empty',
  //     //   lastName: ctx.message.new_chat_participant.last_name || 'empty',
  //     //   userName: ctx.message.new_chat_participant.username,
  //     //   telegramId: ctx.message.new_chat_participant.id,
  //     //   isAdmin: false,
  //     // };
  //     // await ctx.deleteMessage(ctx.message.message_id);
  //     await ctx
  //       .reply(
  //         `@${ctx.message.new_chat_participant.username}, приветствую в группе ${ctx.chat['title']}! `,
  //         {
  //           disable_notification: true,
  //         },
  //       )
  //       .then(({ message_id }) => {
  //         setTimeout(() => ctx.deleteMessage(message_id), 10000);
  //       });
  //     return;
  //   } catch (err) {
  //     console.log(err.message);
  //     // await ctx.deleteMessage(ctx.message.message_id);
  //     await ctx
  //       .replyWithHTML(err.message, { disable_notification: true })
  //       .then(({ message_id }) => {
  //         setTimeout(() => ctx.deleteMessage(message_id), 3000);
  //       });
  //     return;
  //   }
  // }

  // @On('left_chat_member')
  // async deleteUser(
  //   @Ctx()
  //   ctx: ContextInterface & {
  //     message: {
  //       left_chat_member: {
  //         id: number;
  //       };
  //     };
  //   },
  // ) {
  //   try {
  //     const _user = await this.userService.getByTelegramId(
  //       ctx.message.left_chat_member.id,
  //     );
  //
  //     if (!_user) return;
  //
  //     const deletedUser = await this.userService.remove(
  //       ctx.message.left_chat_member.id,
  //     );
  //
  //     return;
  //   } catch (err) {
  //     console.log(err.message);
  //   }
  // }

  // @Action('shareInfo')
  // async shareInfo(@Sender() sender: any, @Ctx() ctx: ContextInterface) {
  //   try {
  //     const groupInfo = await this.groupService.getByTelegramId(ctx.chat.id);
  //
  //     const addUser: CreateUserDto = {
  //       firstName: ctx.callbackQuery.from.first_name || 'empty',
  //       lastName: ctx.callbackQuery.from.last_name || 'empty',
  //       userName: ctx.callbackQuery.from.username || 'empty',
  //       telegramId: ctx.callbackQuery.from.id,
  //       isAdmin: true,
  //       groupId: groupInfo.id,
  //     };
  //
  //     const newUser = await this.userService.create({
  //       firstName: addUser.firstName,
  //       lastName: addUser.lastName,
  //       userName: addUser.userName,
  //       telegramId: addUser.telegramId,
  //       isAdmin: addUser.isAdmin,
  //       groupId: addUser.groupId,
  //     });
  //
  //     await ctx.deleteMessage(ctx.callbackQuery.message.message_id);
  //     return `В БД добавлен пользователь ${newUser.userName}`;
  //   } catch (err) {
  //     console.log(err.message);
  //   }
  // }

  // =================================================================
  // =================================================================

  //  Private methods =================================================================

  async onModuleDestroy() {
    console.log('Конец работы');
  }

  // private async isAdmin(chatId: number, userId: number, ctx: ContextInterface) {
  //   return new Promise((resolve, reject) => {
  //     ctx.telegram
  //       .getChatMember(chatId, userId)
  //       .then(user => {
  //         resolve(user.status === 'administrator' || user.status === 'creator');
  //       })
  //       .catch(error => reject(error));
  //   });
  // }

  // private async isAdmin(chatId: number, userId: number, ctx: ContextInterface) {
  //   return new Promise((resolve, reject) => {
  //     ctx.telegram
  //       .getChatMember(chatId, userId)
  //       .then(user => {
  //         resolve(user.status === 'administrator' || user.status === 'creator');
  //       })
  //       .catch(error => reject(error));
  //   });
  // }

  // @On('new_chat_members')
  // async addUser(
  //   @Ctx()
  //     ctx: ContextInterface & {
  //     message: {
  //       new_chat_participant: {
  //         first_name: string;
  //         last_name: string;
  //         username: string;
  //         id: number;
  //       };
  //     };
  //   },
  // ) {
  //   try {
  //     const group = await this.groupService.getByTelegramId(ctx.chat.id);
  //
  //     const addUser: any = {
  //       firstName: ctx.message.new_chat_participant.first_name || 'empty',
  //       lastName: ctx.message.new_chat_participant.last_name || 'empty',
  //       userName: ctx.message.new_chat_participant.username,
  //       telegramId: ctx.message.new_chat_participant.id,
  //       isAdmin: false,
  //       groupId: group.id,
  //     };
  //
  //     const _user = await this.userService.getByTelegramId(addUser.telegramId);
  //
  //     if (_user) {
  //       await ctx.reply(
  //         `Данный пользователь "${_user.userName}" уже добавлен в БД.`,
  //       );
  //       return;
  //     }
  //
  //     const newUser = await this.userService.create({
  //       firstName: addUser.firstName,
  //       lastName: addUser.lastName,
  //       userName: addUser.userName,
  //       telegramId: addUser.telegramId,
  //       isAdmin: addUser.isAdmin,
  //       groupId: addUser.groupId,
  //     });
  //
  //     await ctx.reply(
  //       `Данный пользователь "${newUser.userName}" добавлен в БД.`,
  //     );
  //
  //     return;
  //   } catch (err) {
  //     console.log(err.message);
  //   }
  // }
}
