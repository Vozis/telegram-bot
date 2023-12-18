import {
  Action,
  Command,
  Ctx,
  Help,
  InjectBot,
  Sender,
  Start,
  Update,
} from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import {
  ContextInterface,
  SceneContextInterface,
} from './types/context.interface';
import { UserService } from '../user/user.service';
import { GroupService } from '../group/group.service';
import { OnModuleDestroy, UseFilters, UseGuards } from '@nestjs/common';

import { TelegrafExceptionFilter } from './filters/telegraf-exception.filter';
import { AdminGuard } from './guards/admin.guard';

import { LessonService } from '../lesson/lesson.service';
import { CronJobService } from '../cron-job/cron-job.service';
import { getLessonTypeRevert, getTimeObject } from '../utils/functions';
import { TaskService } from '../task/task.service';
import { Actions, BotButtons, BotScenes } from '../utils/constants';

@Update()
export class BotUpdate implements OnModuleDestroy {
  constructor(
    @InjectBot('HelperBot')
    private readonly bot: Telegraf<ContextInterface>,
    private readonly userService: UserService,
    private readonly groupService: GroupService,
    private readonly lessonService: LessonService,
    private readonly cronJobService: CronJobService,
    private readonly taskService: TaskService,
  ) {}

  @Start()
  async showStartButton(@Ctx() ctx: ContextInterface, @Sender() sender: any) {
    try {
      await this.bot.telegram.setMyCommands([
        { command: BotButtons.START, description: 'Начало работы' },
        { command: BotButtons.ADMIN, description: 'Функции администратора' },
        {
          command: BotButtons.GET_SCHEDULE,
          description: 'Получить расписание',
        },
        {
          command: BotButtons.GET_QUESTION,
          description: 'Получить задачу дня',
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

  // Buttons logic =================================================================

  // Создание урока
  @Action(Actions.CreateGroupSchedule)
  async createLessonScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter(BotScenes.CreateLessonScene);
  }

  // Создание урока
  @Action(Actions.DeleteLessonFromSchedule)
  async deleteLessonScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter(BotScenes.DeleteLessonScene);
  }

  @UseGuards(AdminGuard)
  @Action(Actions.GetScheduleAdmin)
  async getScheduleAdminScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter(BotScenes.GetLessonsScene);
  }

  @Action(Actions.CreateGroup)
  async createGroupScene(@Ctx() ctx: SceneContextInterface) {
    await ctx.scene.enter(BotScenes.CreateGroupScene);
  }

  @Action(Actions.UpdateTasks)
  async updateTasksScene(@Ctx() ctx: ContextInterface) {
    try {
      return await this.taskService.getTasksFromGoogleSheet();
    } catch (err) {
      console.log(err.message);
    }
  }

  @Action(Actions.SyncSchedule)
  async syncSchedule(@Ctx() ctx: ContextInterface) {
    try {
      let startMessage = null;
      await ctx
        .reply('Получение расписания...', {
          disable_notification: true,
        })
        .then(({ message_id }) => {
          startMessage = message_id;
        });
      const res = await this.lessonService.getFromGoogleSheet();
      await ctx
        .reply(res, {
          disable_notification: true,
        })
        .then(({ message_id }) => {
          ctx.deleteMessage(startMessage);
          setTimeout(() => {
            ctx.deleteMessage(message_id);
          }, 3000);
        });
      return;
    } catch (err) {
      console.log(err.message);
    }
  }

  // Actions =================================================================

  @UseGuards(AdminGuard)
  @UseFilters(TelegrafExceptionFilter)
  @Command('admin')
  async showAdminCommandsButton(@Ctx() ctx: ContextInterface) {
    try {
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx
        .reply('Что ты хочешь сделать?', {
          disable_notification: true,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Добавить группу в БД',
                  callback_data: Actions.CreateGroup,
                },
              ],
              [
                {
                  text: 'Добавить расписание группы',
                  callback_data: Actions.CreateGroupSchedule,
                },
              ],
              [
                {
                  text: 'Удалить урок из расписания',
                  callback_data: Actions.DeleteLessonFromSchedule,
                },
              ],
              [
                {
                  text: 'Получить расписание для всех групп',
                  callback_data: Actions.GetScheduleAdmin,
                },
              ],
              [
                {
                  text: 'Обновить расписание',
                  callback_data: Actions.SyncSchedule,
                },
              ],
              // [
              //   {
              //     text: 'Обновить задания в группах',
              //     callback_data: Actions.UpdateTasks,
              //   },
              // ],
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
    const jobs = await this.cronJobService.getCronJobsFromCronSchedule();

    return jobs;
  }

  @UseFilters(TelegrafExceptionFilter)
  @Command('get_question')
  async getTaskForDay(@Ctx() ctx: ContextInterface) {
    try {
      const groupInfo = await this.groupService.getByTelegramId(ctx.chat.id);

      const task = await this.taskService.getTaskForGroupToday(groupInfo.id);

      if (!task.actions.length) {
        await ctx.deleteMessage(ctx.message.message_id);
        await ctx
          .replyWithHTML(task.message, {
            disable_notification: true,
          })
          .then(({ message_id }) => {
            setTimeout(() => ctx.deleteMessage(message_id), 3000);
          });
        return;
      } else {
        await ctx.deleteMessage(ctx.message.message_id);
        await ctx
          .reply(task.message, {
            disable_notification: true,
            reply_markup: {
              inline_keyboard: task.actions.map(action => {
                return [
                  {
                    text: action,
                    callback_data: action,
                  },
                ];
              }),
            },
          })
          .then(({ message_id }) => {
            setTimeout(() => ctx.deleteMessage(message_id), 3000);
          });
        return;
      }
    } catch (err) {
      console.log(err.message);
      await ctx.deleteMessage(ctx.message.message_id);
      await ctx.replyWithHTML(err.message).then(({ message_id }) => {
        setTimeout(() => ctx.deleteMessage(message_id), 3000);
      });
      return;
    }
  }
  @UseFilters(TelegrafExceptionFilter)
  @Command('get_schedule')
  async getScheduleButton(@Ctx() ctx: ContextInterface) {
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
              const lessonTime = getTimeObject(lesson.time);
              return `\n - ${lesson.day}, ${lessonTime.hours}:${
                lessonTime.minutes === 0 ? '00' : lessonTime.minutes
              } - ${getLessonTypeRevert(lesson.type)}`;
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

  //  Private methods =================================================================

  async onModuleDestroy() {
    console.log('Конец работы');
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
}
